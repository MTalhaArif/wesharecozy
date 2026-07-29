"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ratingSchema } from "@/lib/schemas/interest-schema";

const inputSchema = z.object({
  requestId: z.string().min(1),
  token: z.string().min(1),
  rating: ratingSchema,
});

export async function submitSeekerRating(input: unknown) {
  const parsed = inputSchema.parse(input);

  const ref = adminDb.collection("interestRequests").doc(parsed.requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Request not found");
  }
  const data = snapshot.data()!;
  // Token check is this action's entire authorization -- the seeker has no
  // Firebase auth to verify instead.
  if (data.seekerRatingToken !== parsed.token) {
    throw new Error("Invalid or missing tracking link");
  }
  if (data.status !== "DEAL_MADE") {
    throw new Error("Rating is only available after a deal is confirmed");
  }

  await ref.update({
    seekerRating: {
      stars: parsed.rating.stars,
      comment: parsed.rating.comment ?? null,
      ratedAt: FieldValue.serverTimestamp(),
    },
  });

  return { success: true };
}
