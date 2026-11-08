import type { RideCoordinates } from "@datxe/shared";

// Start at street level around the customer while nearby-driver queries still cover 5 km.
const VIEWPORT_RADIUS_KM = 1;
const MAX_LATITUDE = 85.05112878;

export function homeMapBounds({ lat, lng }: RideCoordinates) {
  const latDelta = VIEWPORT_RADIUS_KM / 110.5;
  const lngDelta = VIEWPORT_RADIUS_KM / (111.32 * Math.cos(lat * Math.PI / 180));
  const sw: [number, number] = [Math.max(-180, lng - lngDelta), Math.max(-MAX_LATITUDE, lat - latDelta)];
  const ne: [number, number] = [Math.min(180, lng + lngDelta), Math.min(MAX_LATITUDE, lat + latDelta)];
  return { sw, ne };
}
