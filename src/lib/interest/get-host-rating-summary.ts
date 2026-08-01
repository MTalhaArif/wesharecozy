import { adminDb } from "@/lib/firebase-admin";

export type HostRatingSummary = {
  averageStars: number;
  count: number;
};

// Aggregates the ratings a host has received from seekers (seekerRating --
// the seeker rates the host, hostRating is the reverse) across every
// interestRequests doc for their listings. Single equality filter, no
// orderBy, so no composite index -- same pattern as searchListings() etc.
export async function getHostRatingSummary(hostUid: string): Promise<HostRatingSummary | null> {
  const snapshot = await adminDb.collection("interestRequests").where("hostUid", "==", hostUid).get();

  const stars = snapshot.docs
    .map((doc) => doc.data().seekerRating?.stars as number | undefined)
    .filter((value): value is number => typeof value === "number");

  if (stars.length === 0) {
    return null;
  }

  const averageStars = stars.reduce((sum, value) => sum + value, 0) / stars.length;
  return { averageStars, count: stars.length };
}
