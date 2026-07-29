import { describe, expect, it } from "vitest";
import { isListingExpired } from "@/lib/listings/is-expired";

describe("isListingExpired", () => {
  it("is false for a draft with no publishedAt", () => {
    expect(isListingExpired(null)).toBe(false);
  });

  it("is false just under 30 days after publish", () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-30T23:59:59Z");
    expect(isListingExpired(publishedAt, now)).toBe(false);
  });

  it("is true just over 30 days after publish", () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-31T00:00:01Z");
    expect(isListingExpired(publishedAt, now)).toBe(true);
  });
});