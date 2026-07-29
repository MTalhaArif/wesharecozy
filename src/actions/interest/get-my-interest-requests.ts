"use server";

import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({ idToken: z.string().min(1) });

export type HostInterestRequest = {
  id: string;
  listingId: string;
  listingTitleTr: string;
  seekerName: string;
  seekerContact: string;
  status: "PENDING" | "DEAL_MADE" | "NOT_INTERESTED";
  hasHostRating: boolean;
  createdAt: string;
};

export async function getMyInterestRequests(input: unknown): Promise<HostInterestRequest[]> {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate. 2. Authorize: uid comes from the verified token, so this
  // can only ever return requests for the caller's own listings.
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  const snapshot = await adminDb
    .collection("interestRequests")
    .where("hostUid", "==", decoded.uid)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      listingId: data.listingId,
      listingTitleTr: data.listingTitleTr,
      seekerName: data.seekerName,
      seekerContact: data.seekerContact,
      status: data.status,
      hasHostRating: data.hostRating != null,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
    };
  });
}
