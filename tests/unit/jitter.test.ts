import { describe, expect, it } from "vitest";
import { jitterCoordinates, type Coordinates } from "@/lib/geo/jitter";

const EARTH_RADIUS_METERS = 6_371_000;

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

const ISTANBUL_CENTER: Coordinates = { lat: 41.0082, lng: 28.9784 };

describe("jitterCoordinates", () => {
  it("stays within the default 300m radius across many random draws", () => {
    for (let i = 0; i < 200; i++) {
      const jittered = jitterCoordinates(ISTANBUL_CENTER);
      expect(haversineMeters(ISTANBUL_CENTER, jittered)).toBeLessThanOrEqual(300 + 1e-6);
    }
  });

  it("respects a custom maxMeters", () => {
    for (let i = 0; i < 50; i++) {
      const jittered = jitterCoordinates(ISTANBUL_CENTER, { maxMeters: 50 });
      expect(haversineMeters(ISTANBUL_CENTER, jittered)).toBeLessThanOrEqual(50 + 1e-6);
    }
  });

  it("returns the origin unchanged when the injected random function always returns 0", () => {
    const jittered = jitterCoordinates(ISTANBUL_CENTER, { random: () => 0 });
    expect(jittered.lat).toBeCloseTo(ISTANBUL_CENTER.lat, 6);
    expect(jittered.lng).toBeCloseTo(ISTANBUL_CENTER.lng, 6);
  });

  it("is deterministic given the same injected random function", () => {
    const random = () => 0.5;
    const a = jitterCoordinates(ISTANBUL_CENTER, { random });
    const b = jitterCoordinates(ISTANBUL_CENTER, { random });
    expect(a).toEqual(b);
  });
});