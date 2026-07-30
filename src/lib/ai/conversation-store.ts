import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { ChatLocale } from "@/lib/schemas/ai-schema";
import type { ChatHistoryMessage } from "./history";

export type ConversationCaller = {
  uid: string | null;
  sessionId: string | null;
};

export type ConversationRecord = {
  id: string;
  ownerUid: string | null;
  sessionId: string | null;
};

export class ForbiddenConversationError extends Error {
  constructor() {
    super("This conversation does not belong to the caller");
  }
}

// Loading an existing conversation IS the permission check here: a caller
// can only continue a conversation whose ownerUid/sessionId matches their
// own identity. There is no Firestore rule expressing that (the collection
// is fully locked) -- this check is the only gate, so it must run before any
// message is read or written.
export async function loadOrCreateConversation(
  conversationId: string | undefined,
  caller: ConversationCaller,
  locale: ChatLocale,
): Promise<ConversationRecord> {
  if (conversationId) {
    const snapshot = await adminDb.collection("aiConversations").doc(conversationId).get();
    if (snapshot.exists) {
      const data = snapshot.data()!;
      const ownedByUid = caller.uid !== null && data.ownerUid === caller.uid;
      const ownedBySession = caller.sessionId !== null && data.sessionId === caller.sessionId;
      if (!ownedByUid && !ownedBySession) {
        throw new ForbiddenConversationError();
      }
      return { id: snapshot.id, ownerUid: data.ownerUid ?? null, sessionId: data.sessionId ?? null };
    }
  }

  const ref = adminDb.collection("aiConversations").doc();
  await ref.set({
    ownerUid: caller.uid,
    sessionId: caller.sessionId,
    status: "ACTIVE",
    locale,
    messageCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    lastMessageAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, ownerUid: caller.uid, sessionId: caller.sessionId };
}

// Read-only ownership check for an existing conversation -- unlike
// loadOrCreateConversation(), this never creates one. Returns null if it
// doesn't exist; throws ForbiddenConversationError if it exists but belongs
// to someone else.
export async function getOwnedConversation(
  conversationId: string,
  caller: ConversationCaller,
): Promise<ConversationRecord | null> {
  const snapshot = await adminDb.collection("aiConversations").doc(conversationId).get();
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data()!;
  const ownedByUid = caller.uid !== null && data.ownerUid === caller.uid;
  const ownedBySession = caller.sessionId !== null && data.sessionId === caller.sessionId;
  if (!ownedByUid && !ownedBySession) {
    throw new ForbiddenConversationError();
  }
  return { id: snapshot.id, ownerUid: data.ownerUid ?? null, sessionId: data.sessionId ?? null };
}

export async function loadHistory(conversationId: string): Promise<ChatHistoryMessage[]> {
  // Filtering role in-memory rather than via a Firestore `where("role", "in",
  // ...)` + orderBy combination avoids needing a composite index -- this
  // collection is small per conversation (a limit(40) read), so there's no
  // cost to filtering out TOOL-role rows in JS instead.
  const snapshot = await adminDb
    .collection("aiConversations")
    .doc(conversationId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return { role: data.role as string, content: data.content as string };
    })
    .filter((entry): entry is { role: "USER" | "ASSISTANT"; content: string } =>
      entry.role === "USER" || entry.role === "ASSISTANT",
    )
    .map((entry) => ({
      role: entry.role === "USER" ? "user" : "assistant",
      content: entry.content,
    }) satisfies ChatHistoryMessage)
    .reverse();
}

export type TranscriptMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "TOOL";
  content: string;
  toolCallsJson: unknown;
  toolResultsJson: unknown;
  flaggedReason: string | null;
  createdAt: Date | null;
};

// Client-facing transcript, unlike loadHistory() (which only extracts the
// role/content pairs the model itself needs re-fed on the next turn). Used
// to hydrate the widget on reload and to render the /assistant history page.
export async function loadFullTranscript(conversationId: string): Promise<TranscriptMessage[]> {
  const snapshot = await adminDb
    .collection("aiConversations")
    .doc(conversationId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      role: data.role,
      content: data.content ?? "",
      toolCallsJson: data.toolCallsJson ?? null,
      toolResultsJson: data.toolResultsJson ?? null,
      flaggedReason: data.flaggedReason ?? null,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
    } satisfies TranscriptMessage;
  });
}

export type PersistableMessage = {
  role: "USER" | "ASSISTANT" | "TOOL";
  content: string;
  toolCallsJson?: unknown;
  toolResultsJson?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  stopReason?: string | null;
  flaggedReason?: string | null;
};

export async function persistMessage(conversationId: string, message: PersistableMessage): Promise<string> {
  const ref = await adminDb
    .collection("aiConversations")
    .doc(conversationId)
    .collection("messages")
    .add({
      role: message.role,
      content: message.content,
      toolCallsJson: message.toolCallsJson ?? null,
      toolResultsJson: message.toolResultsJson ?? null,
      inputTokens: message.inputTokens ?? null,
      outputTokens: message.outputTokens ?? null,
      latencyMs: message.latencyMs ?? null,
      stopReason: message.stopReason ?? null,
      flaggedReason: message.flaggedReason ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  return ref.id;
}

export async function updateConversationTotals(
  conversationId: string,
  deltaMessageCount: number,
  deltaInputTokens: number,
  deltaOutputTokens: number,
): Promise<void> {
  await adminDb
    .collection("aiConversations")
    .doc(conversationId)
    .set(
      {
        messageCount: FieldValue.increment(deltaMessageCount),
        totalInputTokens: FieldValue.increment(deltaInputTokens),
        totalOutputTokens: FieldValue.increment(deltaOutputTokens),
        lastMessageAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
