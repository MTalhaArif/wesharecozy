"use client"; // owns the live chat session: SSE streaming, Firebase Auth state, localStorage-persisted identity

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { getConversationMessages } from "@/actions/ai/get-conversation-messages";
import { submitFeedback } from "@/actions/ai/submit-feedback";
import { transcriptEntryToDisplay, type DisplayMessage, type ChatStreamEvent } from "./chat-types";
import { ChatLauncherButton } from "./chat-launcher-button";
import { ChatPanel } from "./chat-panel";
import { ChatDisclosure } from "./chat-disclosure";
import { ChatMessageList } from "./chat-message-list";
import { ChatStarterPrompts } from "./chat-starter-prompts";
import { ChatInput } from "./chat-input";
import { ChatEscalationForm } from "./chat-escalation-form";

const SESSION_STORAGE_KEY = "wesharecozy_chat_session_id";
const CONVERSATION_STORAGE_KEY = "wesharecozy_chat_conversation_id";

function newKey(): string {
  return crypto.randomUUID();
}

export function ChatWidget() {
  const t = useTranslations("Chat");
  const locale = useLocale() as "en" | "tr";

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);

  const currentAssistantKeyRef = useRef<string | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    setSessionId(id);
    return onAuthStateChanged(clientAuth, (nextUser) => {
      setUser(nextUser);
      setAuthChecked(true);
    });
  }, []);

  // Hydrate a previous conversation once we know both the session id and
  // whether the caller is signed in -- doing it before authChecked resolves
  // risks sending the wrong identity and getting a false ownership mismatch.
  useEffect(() => {
    if (!authChecked || !sessionId) return;
    const storedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!storedConversationId) return;

    let cancelled = false;
    (async () => {
      try {
        const idToken = user ? await user.getIdToken() : undefined;
        const transcript = await getConversationMessages({
          conversationId: storedConversationId,
          idToken,
          sessionId: idToken ? undefined : sessionId,
        });
        if (cancelled || transcript.length === 0) return;
        setConversationId(storedConversationId);
        setMessages(transcript.flatMap(transcriptEntryToDisplay));
      } catch {
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authChecked, sessionId, user]);

  function updateMessage(key: string, updater: (m: DisplayMessage) => DisplayMessage) {
    setMessages((prev) => prev.map((m) => (m.key === key ? updater(m) : m)));
  }

  function handleStreamEvent(event: ChatStreamEvent) {
    switch (event.type) {
      case "text": {
        if (currentAssistantKeyRef.current) {
          const key = currentAssistantKeyRef.current;
          updateMessage(key, (m) => (m.kind === "assistant" ? { ...m, text: m.text + event.text } : m));
        } else {
          const key = newKey();
          currentAssistantKeyRef.current = key;
          setMessages((prev) => [
            ...prev,
            { key, kind: "assistant", text: event.text, streaming: true, messageId: null, feedback: null },
          ]);
        }
        break;
      }
      case "tool_start": {
        currentAssistantKeyRef.current = null;
        setMessages((prev) => [
          ...prev,
          { key: newKey(), kind: "tool", tool: event.tool, args: event.args, result: null, pending: true },
        ]);
        break;
      }
      case "tool_result": {
        setMessages((prev) => {
          const reverseIndex = [...prev]
            .reverse()
            .findIndex((m) => m.kind === "tool" && m.tool === event.tool && m.pending);
          if (reverseIndex === -1) return prev;
          const index = prev.length - 1 - reverseIndex;
          const next = [...prev];
          const target = next[index];
          if (target.kind === "tool") {
            next[index] = { ...target, pending: false, result: event.result };
          }
          return next;
        });
        break;
      }
      case "done": {
        setConversationId(event.conversationId);
        localStorage.setItem(CONVERSATION_STORAGE_KEY, event.conversationId);
        if (currentAssistantKeyRef.current) {
          const key = currentAssistantKeyRef.current;
          updateMessage(key, (m) => (m.kind === "assistant" ? { ...m, streaming: false, messageId: event.assistantMessageId } : m));
        }
        currentAssistantKeyRef.current = null;
        break;
      }
      case "error": {
        currentAssistantKeyRef.current = null;
        setMessages((prev) => [
          ...prev,
          { key: newKey(), kind: "error", text: event.message, offerEscalation: event.offerEscalation },
        ]);
        break;
      }
    }
    setScrollKey((k) => k + 1);
  }

  async function send(text: string) {
    setSending(true);
    setMessages((prev) => [...prev, { key: newKey(), kind: "user", text }]);
    currentAssistantKeyRef.current = null;
    setScrollKey((k) => k + 1);

    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: text,
          idToken,
          sessionId: idToken ? undefined : sessionId,
          locale,
        }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.json().catch(() => ({}) as Record<string, unknown>);
        setMessages((prev) => [
          ...prev,
          {
            key: newKey(),
            kind: "error",
            text: typeof errorBody.message === "string" ? errorBody.message : t("genericError"),
            offerEscalation: Boolean(errorBody.offerEscalation) || response.status === 429,
          },
        ]);
        if (response.status === 403) {
          setConversationId(null);
          localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const records = buffer.split("\n\n");
        buffer = records.pop() ?? "";
        for (const record of records) {
          const line = record.trim();
          if (!line.startsWith("data:")) continue;
          const event = JSON.parse(line.slice("data:".length).trim()) as ChatStreamEvent;
          handleStreamEvent(event);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { key: newKey(), kind: "error", text: t("genericError"), offerEscalation: true }]);
    } finally {
      setSending(false);
      if (!isOpenRef.current) setUnread(true);
      setScrollKey((k) => k + 1);
    }
  }

  async function handleFeedback(messageKey: string, messageId: string, rating: "HELPFUL" | "NOT_HELPFUL") {
    updateMessage(messageKey, (m) => (m.kind === "assistant" ? { ...m, feedback: rating } : m));
    if (!conversationId) return;
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      await submitFeedback({
        conversationId,
        messageId,
        rating,
        idToken,
        sessionId: idToken ? undefined : sessionId,
      });
    } catch {
      // Best-effort -- feedback isn't critical enough to surface a failure UI for.
    }
  }

  return (
    <>
      <ChatLauncherButton
        isOpen={isOpen}
        unread={unread}
        onClick={() => {
          setIsOpen((open) => !open);
          setUnread(false);
        }}
      />
      {isOpen && (
        <ChatPanel
          onClose={() => setIsOpen(false)}
          onTalkToHuman={() => setShowEscalationForm(true)}
          scrollKey={scrollKey}
          footer={!showEscalationForm && <ChatInput disabled={sending} onSend={send} />}
        >
          {showEscalationForm ? (
            <ChatEscalationForm
              conversationId={conversationId}
              user={user}
              sessionId={sessionId}
              onDone={() => setShowEscalationForm(false)}
            />
          ) : (
            <>
              <ChatDisclosure />
              {messages.length === 0 ? (
                <ChatStarterPrompts onPick={send} />
              ) : (
                <ChatMessageList
                  messages={messages}
                  onFeedback={handleFeedback}
                  onTalkToHuman={() => setShowEscalationForm(true)}
                />
              )}
            </>
          )}
        </ChatPanel>
      )}
    </>
  );
}
