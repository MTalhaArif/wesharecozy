"use server";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyOtpInputSchema } from "@/lib/schemas/phone-schema";

const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function verifyOtp(input: unknown) {
  const parsed = verifyOtpInputSchema.parse(input);

  // 1. Authenticate
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);
  const uid = decoded.uid;

  // 2. Authorize: verifying the caller's own pending code (uid from token).

  // 3. Input already parsed above.

  // 4. Act
  const verificationRef = adminDb.collection("phoneVerifications").doc(uid);
  const snapshot = await verificationRef.get();
  if (!snapshot.exists) {
    throw new Error("No verification code was requested");
  }

  const data = snapshot.data() as {
    phoneE164: string;
    codeHash: string;
    expiresAt: FirebaseFirestore.Timestamp;
    attempts: number;
    verified: boolean;
  };

  if (data.verified) {
    return { verified: true };
  }
  if (data.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts, request a new code");
  }
  if (data.expiresAt.toMillis() < Date.now()) {
    throw new Error("Code expired, request a new one");
  }
  if (data.codeHash !== hashCode(parsed.code)) {
    await verificationRef.update({ attempts: FieldValue.increment(1) });
    throw new Error("Incorrect code");
  }

  const batch = adminDb.batch();
  batch.update(verificationRef, { verified: true });
  batch.update(adminDb.collection("users").doc(uid), { phoneVerified: true });
  batch.update(adminDb.collection("users").doc(uid).collection("private").doc("contact"), {
    phoneE164: data.phoneE164,
    phoneVerifiedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { verified: true };
}