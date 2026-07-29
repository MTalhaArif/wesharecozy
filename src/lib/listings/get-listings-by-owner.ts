import { adminDb } from "@/lib/firebase-admin";
import { mapPublicListing, type PublicListing } from "./get-listing";

// Deliberately not filtered by status/expiry -- a host managing their own
// listings should see everything they own, including drafts, removed, and
// expired ones, unlike the public-facing district search.
export async function getListingsByOwner(ownerUid: string): Promise<PublicListing[]> {
  const snapshot = await adminDb.collection("listings").where("ownerUid", "==", ownerUid).get();
  return snapshot.docs.map(mapPublicListing);
}
