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

// Extends the getListingsByDistrict() pattern (status/expiry filtering) with
// the additional filters the AI search tool needs. Loads all PUBLISHED
// listings with a single equality filter (no compound Firestore query, so
// no composite index to provision) and filters/sorts everything else --
// district, type, rent, rooms, gender -- in memory. Fine at this app's
// current listing volume; revisit if that stops being true.
export async function searchListings(filters: ListingSearchFilters): Promise<PublicListing[]> {
  const snapshot = await adminDb.collection("listings").where("status", "==", "PUBLISHED").get();
  let listings = snapshot.docs
    .map(mapPublicListing)
    .filter((listing) => !isListingExpired(listing.publishedAt));

  if (filters.districtIds && filters.districtIds.length > 0) {
    const allowedDistricts = new Set(filters.districtIds);
    listings = listings.filter((listing) => allowedDistricts.has(listing.districtId));
  }
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
