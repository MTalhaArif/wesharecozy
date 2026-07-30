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

export async function loadHistory(conversationId: string): Promise<ChatHistoryMessage[]> {
  const snapshot = await adminDb
    .collection("aiConversations")
    .doc(conversationId)
    .collection("messages")
    .where("role", "in", ["USER", "ASSISTANT"])
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        role: data.role === "USER" ? "user" : "assistant",
        content: data.content as string,
      } satisfies ChatHistoryMessage;
    })
    .reverse();
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

export async function persistMessage(conversationId: string, message: PersistableMessage): Promise<void> {
  await adminDb
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
