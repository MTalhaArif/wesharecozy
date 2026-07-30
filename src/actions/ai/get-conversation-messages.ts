"use server";

import { getConversationMessagesSchema } from "@/lib/schemas/ai-schema";
import { resolveCaller } from "@/lib/ai/resolve-caller";
import { getOwnedConversation, loadFullTranscript, type TranscriptMessage } from "@/lib/ai/conversation-store";

export async function getConversationMessages(input: unknown): Promise<TranscriptMessage[]> {
  const parsed = getConversationMessagesSchema.parse(input);
  const caller = await resolveCaller(parsed);

  // Authorize: getOwnedConversation throws if the conversation exists but
  // belongs to someone else, and this returns [] rather than fetching
  // messages at all if it doesn't exist.
  const conversation = await getOwnedConversation(parsed.conversationId, caller);
  if (!conversation) {
    return [];
  }

  return loadFullTranscript(parsed.conversationId);
}
