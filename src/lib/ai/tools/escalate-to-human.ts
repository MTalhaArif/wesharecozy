import type Anthropic from "@anthropic-ai/sdk";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { escalateToHumanInputSchema } from "@/lib/schemas/ai-schema";
import type { ToolExecutionResult } from "./types";

export const escalateToHumanToolDefinition: Anthropic.Tool = {
  name: "escalate_to_human",
  description:
    "Hand the conversation off to a human. Use for: an explicit request for a human; a payment, account, or safety problem; three failed attempts to help; harassment or scam reports; or anything legal/consequential. This is the only tool with a side effect -- it creates a support ticket.",
  input_schema: {
    type: "object",
    properties: {
      reason: { type: "string", description: "Short reason for escalating, e.g. 'reported scam'." },
      summary: { type: "string", description: "A few sentences summarizing the conversation for the human agent." },
    },
    required: ["reason", "summary"],
  },
};

// The one tool with a side effect: creates a SupportTicket doc and marks the
// conversation ESCALATED. ownerUid is null for anonymous callers -- there is
// no account to attach the ticket to.
export async function executeEscalateToHuman(
  rawInput: unknown,
  conversationId: string,
  ownerUid: string | null,
): Promise<ToolExecutionResult> {
  const input = escalateToHumanInputSchema.parse(rawInput ?? {});

  const ticketRef = adminDb.collection("supportTickets").doc();
  const batch = adminDb.batch();

  batch.set(ticketRef, {
    ownerUid,
    conversationId,
    subject: input.reason,
    body: input.summary,
    contactEmail: null,
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
  });

  batch.set(
    adminDb.collection("aiConversations").doc(conversationId),
    {
      status: "ESCALATED",
      escalatedAt: FieldValue.serverTimestamp(),
      escalationReason: input.reason,
    },
    { merge: true },
  );

  await batch.commit();

  return {
    result: {
      ticketId: ticketRef.id,
      message: "A team member will follow up soon.",
    },
    flagged: false,
    flagReasons: [],
  };
}
