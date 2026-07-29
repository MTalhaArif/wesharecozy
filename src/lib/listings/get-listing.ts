import { adminDb } from "@/lib/firebase-admin";
import type { GenderPreference, ListingType } from "@/lib/schemas/listing-schema";

export type ListingStatus = "DRAFT" | "PUBLISHED" | "DEACTIVATED";

// Deliberately reads only the public listings/{id} document, never the
// private/location subcollection — exact coordinates must never reach here.
export type PublicListing = {
  id: string;
  ownerUid: string;
  type: ListingType;
  status: ListingStatus;
  districtId: string;
  neighborhood: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  rentKurus: number;
  depositKurus: number;
  roomCount: number;
  genderPreference: GenderPreference;
  photoUrls: string[];
  jitteredLat: number;
  jitteredLng: number;
  publishedAt: Date | null;
  createdAt: Date;
};

export function mapPublicListing(
  snapshot: FirebaseFirestore.DocumentSnapshot,
): PublicListing {
  const data = snapshot.data()!;
  return {
    id: snapshot.id,
    ownerUid: data.ownerUid,
    type: data.type,
    status: data.status,
    districtId: data.districtId,
    neighborhood: data.neighborhood,
    titleTr: data.titleTr,
    titleEn: data.titleEn,
    descriptionTr: data.descriptionTr,
    descriptionEn: data.descriptionEn,
    rentKurus: data.rentKurus,
    depositKurus: data.depositKurus,
    roomCount: data.roomCount,
    genderPreference: data.genderPreference,
    photoUrls: data.photoUrls ?? [],
    jitteredLat: data.jitteredLat,
    jitteredLng: data.jitteredLng,
    publishedAt: data.publishedAt ? data.publishedAt.toDate() : null,
    createdAt: data.createdAt.toDate(),
  };
}

export async function getListing(listingId: string): Promise<PublicListing | null> {
  const snapshot = await adminDb.collection("listings").doc(listingId).get();
  if (!snapshot.exists) {
    return null;
  }
  return mapPublicListing(snapshot);
}