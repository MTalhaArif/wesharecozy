"use server";

import { z } from "zod";
import { adminAuth } from "@/lib/firebase-admin";
import { getListingsByOwner } from "@/lib/listings/get-listings-by-owner";
import type { PublicListing } from "@/lib/listings/get-listing";

const inputSchema = z.object({ idToken: z.string().min(1) });

export async function getMyListings(input: unknown): Promise<PublicListing[]> {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate. 2. Authorize: uid comes from the verified token, so this
  // can only ever return the caller's own listings.
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  return getListingsByOwner(decoded.uid);
}
