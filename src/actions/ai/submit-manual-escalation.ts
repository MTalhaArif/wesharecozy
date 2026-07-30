"use server";

import { submitManualEscalationSchema } from "@/lib/schemas/ai-schema";
import { resolveCaller } from "@/lib/ai/resolve-caller";
import { getOwnedConversation } from "@/lib/ai/conversation-store";
import { createSupportTicket } from "@/lib/ai/create-support-ticket";

// The chat panel's "talk to a person" form -- same outcome as the model
// calling escalate_to_human, just triggered directly by the user instead of
// through the model.
export async function submitManualEscalation(input: unknown): Promise<{ ticketId: string }> {
  const parsed = submitManualEscalationSchema.parse(input);
  const caller = await resolveCaller(parsed);

  // If a conversationId was supplied, verify the caller actually owns it
  // before attaching the ticket to it -- the field is optional (the form
  // works even with no conversation open yet).
  if (parsed.conversationId) {
    await getOwnedConversation(parsed.conversationId, caller);
  }

  return createSupportTicket({
    ownerUid: caller.uid,
    conversationId: parsed.conversationId ?? null,
    subject: parsed.subject,
    body: parsed.description,
    contactEmail: parsed.contactEmail || null,
  });
}
