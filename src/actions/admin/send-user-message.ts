"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({
  idToken: z.string().min(1),
  targetUid: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

export async function sendUserMessage(input: unknown) {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate + 2. Authorize (admin-only)
  await requireAdmin(parsed.idToken);

  // 3. Input already parsed above.

  // 4. Act
  await adminDb
    .collection("adminMessages")
    .doc(parsed.targetUid)
    .collection("messages")
    .add({
      text: parsed.text,
      fromAdmin: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  return { success: true };
}
