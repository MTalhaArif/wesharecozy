import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

// Pure decision function -- no Firestore -- so the enforcement logic itself
// is unit-testable without an emulator. 20/user/hour, 100/user/day,
// 5/user/minute; anonymous sessions get 5/hour and nothing else.
export function checkRateLimit(
  recentTimestamps: Date[],
  now: Date,
  isAnonymous: boolean,
): RateLimitDecision {
  const countWithin = (windowMs: number) =>
    recentTimestamps.filter((t) => now.getTime() - t.getTime() < windowMs).length;

  if (isAnonymous) {
    if (countWithin(HOUR_MS) >= 5) {
      return { allowed: false, retryAfterSeconds: HOUR_MS / 1000 };
    }
    return { allowed: true };
  }

  if (countWithin(MINUTE_MS) >= 5) {
    return { allowed: false, retryAfterSeconds: MINUTE_MS / 1000 };
  }
  if (countWithin(HOUR_MS) >= 20) {
    return { allowed: false, retryAfterSeconds: HOUR_MS / 1000 };
  }
  if (countWithin(DAY_MS) >= 100) {
    return { allowed: false, retryAfterSeconds: DAY_MS / 1000 };
  }
  return { allowed: true };
}

// Firestore-backed wrapper. `key` is `user:{uid}` or `session:{sessionId}`.
// Stores a rolling window of recent message timestamps, trimmed to the last
// 24h on every check -- cheap at this app's expected per-user volume and
// avoids a composite-index collectionGroup query across conversations.
export async function enforceRateLimit(key: string, isAnonymous: boolean): Promise<RateLimitDecision> {
  const ref = adminDb.collection("rateLimitCounters").doc(key);
  const now = new Date();
  const snapshot = await ref.get();
  const rawTimestamps = (snapshot.data()?.timestamps ?? []) as Timestamp[];
  const cutoff = now.getTime() - DAY_MS;
  const recent = rawTimestamps.map((t) => t.toDate()).filter((d) => d.getTime() > cutoff);

  const decision = checkRateLimit(recent, now, isAnonymous);
  if (decision.allowed) {
    await ref.set(
      {
        timestamps: [...recent, now].map((d) => Timestamp.fromDate(d)),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  return decision;
}
