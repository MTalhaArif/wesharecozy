"use server";

import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import { createListingFormSchema, MAX_LISTING_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/schemas/listing-schema";
import { CURRENT_CONSENT_TEXT_VERSION } from "@/lib/schemas/consent-schema";
import { jitterCoordinates } from "@/lib/geo/jitter";

export async function createListing(formData: FormData) {
  const idToken = formData.get("idToken");
  if (typeof idToken !== "string" || idToken.length === 0) {
    throw new Error("Missing authentication token");
  }

  // 1. Authenticate
  const decoded = await adminAuth.verifyIdToken(idToken);
  const uid = decoded.uid;

  // 2. Authorize: publishing requires a verified phone, enforced here
  // server-side regardless of what the client form currently shows.
  const userSnapshot = await adminDb.collection("users").doc(uid).get();
  if (!userSnapshot.exists || userSnapshot.data()?.phoneVerified !== true) {
    throw new Error("Phone verification is required before publishing a listing");
  }

  // 3. Parse input. Photos are validated separately from the zod schema since
  // File instances need size/count checks, not shape validation.
  const photos = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);
  if (photos.length === 0 || photos.length > MAX_LISTING_PHOTOS) {
    throw new Error(`Listings need between 1 and ${MAX_LISTING_PHOTOS} photos`);
  }
  for (const photo of photos) {
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new Error(`Each photo must be under 5MB (got ${photo.name})`);
    }
  }

  const fullAddress = formData.get("fullAddress");
  const parsed = createListingFormSchema.parse({
    type: formData.get("type"),
    districtId: formData.get("districtId"),
    neighborhood: formData.get("neighborhood"),
    titleTr: formData.get("titleTr"),
    titleEn: formData.get("titleEn"),
    descriptionTr: formData.get("descriptionTr"),
    descriptionEn: formData.get("descriptionEn"),
    rentKurus: Number(formData.get("rentKurus")),
    depositKurus: Number(formData.get("depositKurus")),
    roomCount: Number(formData.get("roomCount")),
    genderPreference: formData.get("genderPreference"),
    exactLat: Number(formData.get("exactLat")),
    exactLng: Number(formData.get("exactLng")),
    fullAddress: typeof fullAddress === "string" && fullAddress.length > 0 ? fullAddress : undefined,
    consentAccepted: formData.get("consentAccepted") === "true",
    commissionAccepted: formData.get("commissionAccepted") === "true",
  });

  const districtSnapshot = await adminDb.collection("districts").doc(parsed.districtId).get();
  if (!districtSnapshot.exists) {
    throw new Error("Listing must belong to a valid Istanbul district");
  }

  // 4. Act
  const listingRef = adminDb.collection("listings").doc();
  const bucket = adminStorage.bucket();

  // Firebase Storage buckets default to Uniform Bucket-Level Access, which
  // disables legacy per-object ACLs -- file.makePublic() throws on those (and
  // isn't supported by the Storage emulator either). Firebase's download-token
  // URL scheme works against both the emulator and any real bucket.
  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
    : "https://firebasestorage.googleapis.com";

  const photoUrls: string[] = [];
  for (const photo of photos) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const objectPath = `listings/${listingRef.id}/${randomUUID()}.jpg`;
    const downloadToken = randomUUID();
    const file = bucket.file(objectPath);
    await file.save(buffer, {
      contentType: "image/jpeg",
      metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
    });
    photoUrls.push(
      `${storageHost}/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`,
    );
  }

  const jittered = jitterCoordinates({ lat: parsed.exactLat, lng: parsed.exactLng });

  const batch = adminDb.batch();
  batch.set(listingRef, {
    ownerUid: uid,
    type: parsed.type,
    status: "PUBLISHED",
    districtId: parsed.districtId,
    neighborhood: parsed.neighborhood,
    titleTr: parsed.titleTr,
    titleEn: parsed.titleEn,
    descriptionTr: parsed.descriptionTr,
    descriptionEn: parsed.descriptionEn,
    rentKurus: parsed.rentKurus,
    depositKurus: parsed.depositKurus,
    roomCount: parsed.roomCount,
    genderPreference: parsed.genderPreference,
    photoUrls,
    jitteredLat: jittered.lat,
    jitteredLng: jittered.lng,
    publishedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(listingRef.collection("private").doc("location"), {
    exactLat: parsed.exactLat,
    exactLng: parsed.exactLng,
    fullAddress: parsed.fullAddress ?? null,
  });
  batch.set(adminDb.collection("users").doc(uid).collection("consents").doc(), {
    consentType: "LISTING_CREATION",
    consentedAt: FieldValue.serverTimestamp(),
    consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
  });
  batch.set(adminDb.collection("users").doc(uid).collection("consents").doc(), {
    consentType: "COMMISSION_AGREEMENT",
    consentedAt: FieldValue.serverTimestamp(),
    consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
  });

  await batch.commit();

  return { listingId: listingRef.id };
}