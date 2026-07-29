"use server";

import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createInterestRequestSchema } from "@/lib/schemas/interest-schema";
import { CURRENT_CONSENT_TEXT_VERSION } from "@/lib/schemas/consent-schema";

// No auth step -- the seeker has no account. "Authorization" here just means
// the referenced listing must actually exist and be published.
export async function createInterestRequest(input: unknown) {
  const parsed = createInterestRequestSchema.parse(input);

  const listingSnapshot = await adminDb.collection("listings").doc(parsed.listingId).get();
  if (!listingSnapshot.exists || listingSnapshot.data()?.status !== "PUBLISHED") {
    throw new Error("Listing not found");
  }
  const listing = listingSnapshot.data()!;

  const seekerRatingToken = randomUUID();
  const requestRef = adminDb.collection("interestRequests").doc();

  await requestRef.set({
    listingId: parsed.listingId,
    hostUid: listing.ownerUid,
    listingTitleTr: listing.titleTr,
    seekerName: parsed.seekerName,
    seekerContact: parsed.seekerContact,
    status: "PENDING",
    seekerRatingToken,
    hostRating: null,
    seekerRating: null,
    createdAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
    consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
  });

  return { requestId: requestRef.id, seekerRatingToken };
}
