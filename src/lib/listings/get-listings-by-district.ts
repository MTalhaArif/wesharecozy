import { adminDb } from "@/lib/firebase-admin";
import { mapPublicListing, type PublicListing } from "./get-listing";
import { isListingExpired } from "./is-expired";

export async function getListingsByDistrict(districtId: string): Promise<PublicListing[]> {
  const snapshot = await adminDb
    .collection("listings")
    .where("districtId", "==", districtId)
    .where("status", "==", "PUBLISHED")
    .get();

  return snapshot.docs
    .map(mapPublicListing)
    .filter((listing) => !isListingExpired(listing.publishedAt));
}