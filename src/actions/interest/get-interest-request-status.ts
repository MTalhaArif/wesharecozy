"use server";

import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({
  requestId: z.string().min(1),
  token: z.string().min(1),
});

export type InterestRequestStatus = {
  status: "PENDING" | "DEAL_MADE" | "NOT_INTERESTED";
  listingTitleTr: string;
  hasSeekerRating: boolean;
};

// The seeker has no Firebase account -- the token they were given at request
// creation time (embedded in their bookmarkable tracking URL) is their only
// credential, checked here server-side, never via a Firestore rule.
export async function getInterestRequestStatus(input: unknown): Promise<InterestRequestStatus> {
  const parsed = inputSchema.parse(input);

  const snapshot = await adminDb.collection("interestRequests").doc(parsed.requestId).get();
  if (!snapshot.exists) {
    throw new Error("Request not found");
  }
  const data = snapshot.data()!;
  if (data.seekerRatingToken !== parsed.token) {
    throw new Error("Invalid or missing tracking link");
  }

  return {
    status: data.status,
    listingTitleTr: data.listingTitleTr,
    hasSeekerRating: data.seekerRating != null,
  };
}
