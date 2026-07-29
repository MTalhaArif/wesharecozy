const LISTING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

// Expiry is computed on read rather than stored, so it can't go stale — a
// listing with status PUBLISHED past this window is treated as expired
// wherever it's queried/displayed, without a background job.
export function isListingExpired(publishedAt: Date | null, now: Date = new Date()): boolean {
  if (!publishedAt) return false;
  return publishedAt.getTime() + LISTING_LIFETIME_MS < now.getTime();
}