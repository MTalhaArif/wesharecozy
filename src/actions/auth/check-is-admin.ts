"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Read-only check used by client components to decide whether to show
// admin-only UI / redirect. Never throws for a non-admin caller -- returns
// false. Actual admin actions still authorize independently via requireAdmin.
export async function checkIsAdmin(idToken: string): Promise<boolean> {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const contactSnapshot = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("private")
      .doc("contact")
      .get();
    return contactSnapshot.data()?.isAdmin === true;
  } catch {
    return false;
  }
}
