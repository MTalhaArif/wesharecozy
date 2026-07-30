import { describe, expect, it } from "vitest";
import { checkRateLimit, MINUTE_MS, HOUR_MS, DAY_MS } from "@/lib/ai/rate-limit";

const NOW = new Date("2026-01-15T12:00:00Z");

function timestampsAgo(msAgoList: number[]): Date[] {
  return msAgoList.map((ms) => new Date(NOW.getTime() - ms));
}

describe("checkRateLimit (authenticated)", () => {
  it("allows a first message with no history", () => {
    expect(checkRateLimit([], NOW, false)).toEqual({ allowed: true });
  });

  it("blocks the 6th message within a minute", () => {
    const timestamps = timestampsAgo([1000, 2000, 3000, 4000, 5000]);
    const result = checkRateLimit(timestamps, NOW, false);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(MINUTE_MS / 1000);
  });

  it("allows the 5th message within a minute (limit is exclusive of the new one)", () => {
    const timestamps = timestampsAgo([10_000, 20_000, 30_000, 40_000]);
    expect(checkRateLimit(timestamps, NOW, false)).toEqual({ allowed: true });
  });

  it("blocks the 21st message within an hour even when spaced out per-minute", () => {
    // 20 messages, each 2 minutes apart -- clears the per-minute gate, hits the hourly one.
    const timestamps = timestampsAgo(Array.from({ length: 20 }, (_, i) => (i + 1) * 2 * MINUTE_MS));
    const result = checkRateLimit(timestamps, NOW, false);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(HOUR_MS / 1000);
  });

  it("blocks the 101st message within a day even when spaced out per-hour", () => {
    const timestamps = timestampsAgo(Array.from({ length: 100 }, (_, i) => (i + 1) * 0.2 * HOUR_MS));
    const result = checkRateLimit(timestamps, NOW, false);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(DAY_MS / 1000);
  });

  it("ignores timestamps older than the window", () => {
    const timestamps = timestampsAgo([DAY_MS + 1000, DAY_MS + 2000]);
    expect(checkRateLimit(timestamps, NOW, false)).toEqual({ allowed: true });
  });
});

describe("checkRateLimit (anonymous)", () => {
  it("allows up to 5 messages per hour", () => {
    const timestamps = timestampsAgo([1000, 2000, 3000, 4000]);
    expect(checkRateLimit(timestamps, NOW, true)).toEqual({ allowed: true });
  });

  it("blocks the 6th message within an hour", () => {
    const timestamps = timestampsAgo([1000, 2000, 3000, 4000, 5000]);
    const result = checkRateLimit(timestamps, NOW, true);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(HOUR_MS / 1000);
  });

  it("is not subject to the authenticated per-minute cap", () => {
    // 4 messages in the last 10 seconds -- would fail the per-minute
    // gate if anonymous callers were subject to it, but they aren't.
    const timestamps = timestampsAgo([1000, 2000, 3000, 4000]);
    expect(checkRateLimit(timestamps, NOW, true).allowed).toBe(true);
  });
});
