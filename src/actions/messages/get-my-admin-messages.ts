"use server";

import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const inputSchema = z.object({ idToken: z.string().min(1) });

export type AdminMessage = {
  id: string;
  text: string;
  createdAt: string;
};

export async function getMyAdminMessages(input: unknown): Promise<AdminMessage[]> {
  const parsed = inputSchema.parse(input);

  // 1. Authenticate. 2. Authorize: uid comes from the verified token, so this
  // can only ever read the caller's own messages.
  const decoded = await adminAuth.verifyIdToken(parsed.idToken);

  const snapshot = await adminDb
    .collection("adminMessages")
    .doc(decoded.uid)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
    };
  });
}
