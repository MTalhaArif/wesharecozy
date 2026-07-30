"use server";

import { adminDb } from "@/lib/firebase-admin";
import { deleteConversationSchema } from "@/lib/schemas/ai-schema";
import { resolveCaller } from "@/lib/ai/resolve-caller";
import { getOwnedConversation } from "@/lib/ai/conversation-store";

const BATCH_CHUNK_SIZE = 400;

// Hard delete -- it's the caller's own data. Deletes every message doc in
// the subcollection, then the conversation doc itself.
export async function deleteConversation(input: unknown): Promise<void> {
  const parsed = deleteConversationSchema.parse(input);
  const caller = await resolveCaller(parsed);

  const conversation = await getOwnedConversation(parsed.conversationId, caller);
  if (!conversation) {
    return;
  }

  const conversationRef = adminDb.collection("aiConversations").doc(parsed.conversationId);
  const messagesSnapshot = await conversationRef.collection("messages").get();

  for (let i = 0; i < messagesSnapshot.docs.length; i += BATCH_CHUNK_SIZE) {
    const batch = adminDb.batch();
    for (const doc of messagesSnapshot.docs.slice(i, i + BATCH_CHUNK_SIZE)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  await conversationRef.delete();
}
