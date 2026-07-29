"use server";

import { createHash, randomInt } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requestOtpInputSchema } from "@/lib/schemas/phone-schema";
import { sendOtp } from "@/lib/otp/send-otp";

const OTP_TTL_MINUTES = 10;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function requestOtp(input: unknown) {
  const parsed = requestOtpInputSchema.parse(input);

  // 1. Authenticate
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);
  const uid = decoded.uid;

  // 2. Authorize: requesting a code for the caller's own account (uid from token).

  // 3. Input already parsed above.

  // 4. Act
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = Timestamp.fromMillis(Date.now() + OTP_TTL_MINUTES * 60_000);

  await adminDb.collection("phoneVerifications").doc(uid).set({
    phoneE164: parsed.phoneE164,
    codeHash: hashCode(code),
    expiresAt,
    attempts: 0,
    verified: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendOtp(parsed.phoneE164, code);

  return { sent: true };
}