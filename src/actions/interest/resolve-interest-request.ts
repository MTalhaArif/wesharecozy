"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({
  idToken: z.string().min(1),
  requestId: z.string().min(1),
  resolution: z.enum(["DEAL_MADE", "NOT_INTERESTED"]),
});

export async function resolveInterestRequest(input: unknown) {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  // 2. Authorize: caller must own the listing this request is for.
  const ref = adminDb.collection("interestRequests").doc(parsed.requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Request not found");
  }
  if (snapshot.data()?.hostUid !== decoded.uid) {
    throw new Error("Not authorized to resolve this request");
  }

  // 3. Input already parsed above.

  // 4. Act
  await ref.update({
    status: parsed.resolution,
    resolvedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}
