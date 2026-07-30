import { describe, expect, it, vi, beforeEach } from "vitest";

const ticketRef = { id: "ticket-1" };
const conversationRef = { id: "conv-1" };
const batchSet = vi.fn();
const batchCommit = vi.fn().mockResolvedValue(undefined);
const collectionMock = vi.fn((name: string) => ({
  doc: vi.fn((id?: string) => (name === "supportTickets" ? ticketRef : { id: id ?? conversationRef.id })),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: (...args: [string]) => collectionMock(...args),
    batch: () => ({ set: batchSet, commit: batchCommit }),
  },
}));

const { executeEscalateToHuman } = await import("@/lib/ai/tools/escalate-to-human");

beforeEach(() => {
  batchSet.mockReset();
  batchCommit.mockClear();
  collectionMock.mockClear();
});

describe("executeEscalateToHuman", () => {
  it("creates an OPEN support ticket and marks the conversation ESCALATED", async () => {
    const { result } = await executeEscalateToHuman(
      { reason: "reported scam", summary: "User says the host asked for a deposit before viewing." },
      "conv-1",
      "user-42",
    );

    expect(batchCommit).toHaveBeenCalledOnce();
    expect(batchSet).toHaveBeenCalledTimes(2);

    const [ticketArgRef, ticketData] = batchSet.mock.calls[0];
    expect(ticketArgRef).toBe(ticketRef);
    expect(ticketData).toMatchObject({
      ownerUid: "user-42",
      conversationId: "conv-1",
      subject: "reported scam",
      body: "User says the host asked for a deposit before viewing.",
      status: "OPEN",
    });

    const [, conversationData] = batchSet.mock.calls[1];
    expect(conversationData).toMatchObject({
      status: "ESCALATED",
      escalationReason: "reported scam",
    });

    expect(result).toMatchObject({ ticketId: "ticket-1" });
  });

  it("stores a null ownerUid for an anonymous caller", async () => {
    await executeEscalateToHuman({ reason: "asked for a human", summary: "Anonymous user request." }, "conv-2", null);
    const [, ticketData] = batchSet.mock.calls[0];
    expect(ticketData).toMatchObject({ ownerUid: null });
  });

  it("rejects an empty summary", async () => {
    await expect(
      executeEscalateToHuman({ reason: "x", summary: "" }, "conv-1", "user-42"),
    ).rejects.toBeTruthy();
  });
});
