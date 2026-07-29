"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({ idToken: z.string().min(1) });

export type AdminListing = {
  id: string;
  titleTr: string;
  ownerUid: string;
  districtId: string;
  status: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  displayName: string;
  createdAt: string;
};

export async function getAdminDashboardData(
  input: unknown,
): Promise<{ listings: AdminListing[]; users: AdminUser[] }> {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate + 2. Authorize (admin-only)
  await requireAdmin(parsed.idToken);

  // 3. Input already parsed above.

  // 4. Act (read-only)
  const [listingsSnapshot, usersSnapshot] = await Promise.all([
    adminDb.collection("listings").orderBy("createdAt", "desc").limit(100).get(),
    adminDb.collection("users").orderBy("createdAt", "desc").limit(100).get(),
  ]);

  const listings: AdminListing[] = listingsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      titleTr: data.titleTr,
      ownerUid: data.ownerUid,
      districtId: data.districtId,
      status: data.status,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
    };
  });

  const users: AdminUser[] = usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      displayName: data.displayName,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
    };
  });

  return { listings, users };
}
