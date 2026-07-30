import { adminDb } from "@/lib/firebase-admin";
import { mapPublicListing, type PublicListing } from "./get-listing";
import { isListingExpired } from "./is-expired";
import type { ListingType, GenderPreference } from "@/lib/schemas/listing-schema";

export type ListingSearchFilters = {
  districtIds?: string[];
  listingTypes?: ListingType[];
  minRentKurus?: number;
  maxRentKurus?: number;
  roomCount?: number;
  genderPreference?: GenderPreference;
  limit?: number;
};

// Firestore's `in` operator caps at 30 values.
const MAX_DISTRICTS_PER_QUERY = 30;

// Extends the getListingsByDistrict() pattern (status/expiry filtering) with
// the additional filters the AI search tool needs. Like that function, this
// loads all matching PUBLISHED listings into memory and filters/sorts there
// rather than building compound Firestore indexes -- fine at this app's
// current listing volume; revisit if that stops being true.
export async function searchListings(filters: ListingSearchFilters): Promise<PublicListing[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection("listings")
    .where("status", "==", "PUBLISHED");

  if (filters.districtIds && filters.districtIds.length > 0) {
    query = query.where("districtId", "in", filters.districtIds.slice(0, MAX_DISTRICTS_PER_QUERY));
  }

  const snapshot = await query.get();
  let listings = snapshot.docs
    .map(mapPublicListing)
    .filter((listing) => !isListingExpired(listing.publishedAt));

  if (filters.listingTypes && filters.listingTypes.length > 0) {
    const allowed = new Set(filters.listingTypes);
    listings = listings.filter((listing) => allowed.has(listing.type));
  }
  if (filters.minRentKurus != null) {
    listings = listings.filter((listing) => listing.rentKurus >= filters.minRentKurus!);
  }
  if (filters.maxRentKurus != null) {
    listings = listings.filter((listing) => listing.rentKurus <= filters.maxRentKurus!);
  }
  if (filters.roomCount != null) {
    listings = listings.filter((listing) => listing.roomCount === filters.roomCount);
  }
  if (filters.genderPreference && filters.genderPreference !== "ANY") {
    listings = listings.filter(
      (listing) =>
        listing.genderPreference === "ANY" || listing.genderPreference === filters.genderPreference,
    );
  }

  listings.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

  return listings.slice(0, filters.limit ?? 20);
}
