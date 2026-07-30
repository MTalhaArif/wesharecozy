import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export type CreateSupportTicketInput = {
  ownerUid: string | null;
  conversationId: string | null;
  subject: string;
  body: string;
  contactEmail: string | null;
};

// Shared by the escalate_to_human AI tool and the chat panel's manual
// "talk to a person" form -- both outcomes are the same: a SupportTicket,
// and (when there's a conversation to mark) the conversation flipped to
// ESCALATED.
export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<{ ticketId: string }> {
  const ticketRef = adminDb.collection("supportTickets").doc();
  const batch = adminDb.batch();

  batch.set(ticketRef, {
    ownerUid: input.ownerUid,
    conversationId: input.conversationId,
    subject: input.subject,
    body: input.body,
    contactEmail: input.contactEmail,
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
  });

  if (input.conversationId) {
    batch.set(
      adminDb.collection("aiConversations").doc(input.conversationId),
      {
        status: "ESCALATED",
        escalatedAt: FieldValue.serverTimestamp(),
        escalationReason: input.subject,
      },
      { merge: true },
    );
  }

  await batch.commit();
  return { ticketId: ticketRef.id };
}
