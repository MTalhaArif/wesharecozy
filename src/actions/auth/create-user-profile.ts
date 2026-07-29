"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createUserProfileInputSchema } from "@/lib/schemas/user-schema";

export async function createUserProfile(input: unknown) {
  // Zod first only to safely extract a typed idToken out of untrusted input —
  // nothing is trusted or acted on until that token is verified below.
  const parsed = createUserProfileInputSchema.parse(input);

  // 1. Authenticate: the ID token must belong to a real, current Firebase user.
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);
  const uid = decoded.uid;
  const email = decoded.email;
  if (!email) {
    throw new Error("Account has no verified email");
  }

  // 2. Authorize: this creates the caller's own profile. uid comes from the
  // verified token, never from client input, so no cross-user check applies.

  // 3. Input already parsed above.

  // 4. Act.
  const userRef = adminDb.collection("users").doc(uid);
  const contactRef = userRef.collection("private").doc("contact");
  const consentRef = userRef.collection("consents").doc();

  const batch = adminDb.batch();
  batch.set(userRef, {
    displayName: parsed.displayName,
    photoURL: null,
    createdAt: FieldValue.serverTimestamp(),
    phoneVerified: false,
    genderForFiltering: parsed.genderForFiltering,
  });
  batch.set(contactRef, {
    email,
    phoneE164: null,
    phoneVerifiedAt: null,
  });
  batch.set(consentRef, {
    consentType: "SIGNUP_TOS",
    consentedAt: FieldValue.serverTimestamp(),
    consentTextVersion: parsed.consentTextVersion,
  });

  await batch.commit();

  return { uid };
}