"use server";

import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({ idToken: z.string().min(1) });

// Lets the client decide, right after signing in (or right after an inline
// signup on the publish-listing form), whether to show the phone-OTP step
// before letting the caller finish publishing -- without this, the client
// would only find out via a 403 from create-listing.ts after filling out
// the whole form.
export async function getMyPhoneVerificationStatus(input: unknown): Promise<{ phoneVerified: boolean }> {
  const parsed = inputSchema.parse(input);
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  const snapshot = await adminDb.collection("users").doc(decoded.uid).get();
  return { phoneVerified: snapshot.data()?.phoneVerified === true };
}
