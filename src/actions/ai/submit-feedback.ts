"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { submitFeedbackSchema } from "@/lib/schemas/ai-schema";
import { resolveCaller } from "@/lib/ai/resolve-caller";
import { getOwnedConversation } from "@/lib/ai/conversation-store";

export async function submitFeedback(input: unknown): Promise<void> {
  const parsed = submitFeedbackSchema.parse(input);
  const caller = await resolveCaller(parsed);

  // Authorize: can only rate a message in a conversation the caller owns.
  const conversation = await getOwnedConversation(parsed.conversationId, caller);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await adminDb.collection("aiFeedback").add({
    conversationId: parsed.conversationId,
    messageId: parsed.messageId,
    ownerUid: caller.uid,
    rating: parsed.rating,
    note: parsed.note ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}
