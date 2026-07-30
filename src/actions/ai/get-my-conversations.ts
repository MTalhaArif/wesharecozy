"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getMyConversationsSchema } from "@/lib/schemas/ai-schema";

export type MyConversationSummary = {
  id: string;
  title: string | null;
  status: "ACTIVE" | "ESCALATED" | "CLOSED";
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string | null;
};

// Authenticated only -- the anonymous no-account flow has no durable "my
// conversations" identity to list against beyond a single sessionId, which
// the widget already tracks client-side.
export async function getMyConversations(input: unknown): Promise<MyConversationSummary[]> {
  const parsed = getMyConversationsSchema.parse(input);
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  // A where() + orderBy() on different fields needs a composite Firestore
  // index; sorting in memory after a plain equality filter avoids
  // provisioning one, same as loadHistory()/searchListings() elsewhere in
  // src/lib/ai and src/lib/listings.
  const snapshot = await adminDb.collection("aiConversations").where("ownerUid", "==", decoded.uid).get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? null,
        status: data.status,
        messageCount: data.messageCount ?? 0,
        lastMessageAt: data.lastMessageAt?.toDate?.() ?? null,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    })
    .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0))
    .slice(0, 50)
    .map((entry) => ({
      ...entry,
      lastMessageAt: entry.lastMessageAt?.toISOString() ?? null,
      createdAt: entry.createdAt?.toISOString() ?? null,
    }));
}
