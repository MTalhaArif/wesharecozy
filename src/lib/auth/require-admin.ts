import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Shared authorize step for every admin Server Action. isAdmin lives on the
// owner-only private/contact doc, never the public users/{uid} doc, so admin
// status is never client-readable by anyone but the admin themselves.
export async function requireAdmin(idToken: string): Promise<string> {
  const decoded = await adminAuth.verifyIdToken(idToken);
  const uid = decoded.uid;

  const contactSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("private")
    .doc("contact")
    .get();

  if (contactSnapshot.data()?.isAdmin !== true) {
    throw new Error("Admin access required");
  }

  return uid;
}
