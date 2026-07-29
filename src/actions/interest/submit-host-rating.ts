"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ratingSchema } from "@/lib/schemas/interest-schema";

const inputSchema = z.object({
  idToken: z.string().min(1),
  requestId: z.string().min(1),
  rating: ratingSchema,
});

export async function submitHostRating(input: unknown) {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  // 2. Authorize: caller must own the listing this request is for.
  const ref = adminDb.collection("interestRequests").doc(parsed.requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Request not found");
  }
  const data = snapshot.data()!;
  if (data.hostUid !== decoded.uid) {
    throw new Error("Not authorized to rate for this request");
  }
  if (data.status !== "DEAL_MADE") {
    throw new Error("Rating is only available after a deal is confirmed");
  }

  // 3. Input already parsed above.

  // 4. Act
  await ref.update({
    hostRating: {
      stars: parsed.rating.stars,
      comment: parsed.rating.comment ?? null,
      ratedAt: FieldValue.serverTimestamp(),
    },
  });

  return { success: true };
}
