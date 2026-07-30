import { adminAuth } from "@/lib/firebase-admin";
import type { ConversationCaller } from "./conversation-store";

// Shared by every AI Server Action that needs to know who's calling, exactly
// like /api/chat itself: a verified Firebase idToken, or an anonymous
// sessionId trusted the same way seekerRatingToken is elsewhere in this
// app -- an unguessable opaque string checked for an exact match against
// what's stored on the resource, never treated as a real identity.
export async function resolveCaller(input: {
  idToken?: string;
  sessionId?: string;
}): Promise<ConversationCaller> {
  if (input.idToken) {
    const decoded = await adminAuth.verifyIdToken(input.idToken);
    return { uid: decoded.uid, sessionId: null };
  }
  if (input.sessionId) {
    return { uid: null, sessionId: input.sessionId };
  }
  throw new Error("Sign in or provide a session id.");
}
