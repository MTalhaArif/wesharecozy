"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({
  idToken: z.string().min(1),
  listingId: z.string().min(1),
});

export async function removeListing(input: unknown) {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate + 2. Authorize (admin-only)
  await requireAdmin(parsed.idToken);

  // 3. Input already parsed above.

  // 4. Act -- soft delete (status flip), not a hard delete, so removed
  // listings stop appearing in search/detail without destroying the record.
  await adminDb.collection("listings").doc(parsed.listingId).update({
    status: "REMOVED",
  });

  return { success: true };
}
