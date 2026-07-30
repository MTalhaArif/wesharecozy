"use client"; // Firebase Auth state check (redirect if signed out) + data fetch/mutation UI

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { useRouter } from "@/i18n/navigation";
import { getMyConversations, type MyConversationSummary } from "@/actions/ai/get-my-conversations";
import { getConversationMessages } from "@/actions/ai/get-conversation-messages";
import { deleteConversation } from "@/actions/ai/delete-conversation";
import { transcriptEntryToDisplay, type DisplayMessage } from "@/components/chat/chat-types";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { Button } from "@/components/ui/button";

export function AssistantHistoryDashboard() {
  const t = useTranslations("Assistant");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<MyConversationSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<DisplayMessage[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        router.push("/login");
        return;
      }
      const idToken = await nextUser.getIdToken();
      setConversations(await getMyConversations({ idToken }));
      setLoading(false);
    });
  }, [router]);

  const toggleTranscript = async (conversationId: string) => {
    if (expandedId === conversationId) {
      setExpandedId(null);
      return;
    }
    if (!user) return;
    setExpandedId(conversationId);
    setTranscriptLoading(true);
    const idToken = await user.getIdToken();
    const entries = await getConversationMessages({ conversationId, idToken });
    setTranscript(entries.flatMap(transcriptEntryToDisplay));
    setTranscriptLoading(false);
  };

  const handleDelete = async (conversationId: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await deleteConversation({ conversationId, idToken });
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (expandedId === conversationId) {
      setExpandedId(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground p-8">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-8">
      {conversations.length === 0 && <p className="text-muted-foreground text-sm">{t("empty")}</p>}
      {conversations.map((conversation) => (
        <div key={conversation.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{conversation.title ?? t("untitled")}</p>
              <p className="text-muted-foreground text-xs">
                {t(`status.${conversation.status}`)} · {t("messageCount", { count: String(conversation.messageCount) })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => toggleTranscript(conversation.id)}>
                {expandedId === conversation.id ? t("hideTranscript") : t("viewTranscript")}
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(conversation.id)}>
                {t("delete")}
              </Button>
            </div>
          </div>

          {expandedId === conversation.id && (
            <div className="max-h-96 overflow-y-auto rounded-lg border">
              {transcriptLoading ? (
                <p className="text-muted-foreground p-4 text-sm">{t("loading")}</p>
              ) : (
                <ChatMessageList messages={transcript} onFeedback={() => {}} onTalkToHuman={() => {}} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
