const EARTH_RADIUS_METERS = 6_371_000;
const DEFAULT_MAX_JITTER_METERS = 300;

export type Coordinates = { lat: number; lng: number };

/**
 * Offsets a coordinate by a random distance (up to maxMeters) in a random
 * direction. Used to hide exact listing addresses on public pages — only the
 * jittered point is ever stored on the public listing document.
 */
export function jitterCoordinates(
  coordinates: Coordinates,
  options: { maxMeters?: number; random?: () => number } = {},
): Coordinates {
  const { maxMeters = DEFAULT_MAX_JITTER_METERS, random = Math.random } = options;

  const distance = random() * maxMeters;
  const bearing = random() * 2 * Math.PI;
  const angularDistance = distance / EARTH_RADIUS_METERS;

  const latRad = (coordinates.lat * Math.PI) / 180;
  const lngRad = (coordinates.lng * Math.PI) / 180;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad),
    );

  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}