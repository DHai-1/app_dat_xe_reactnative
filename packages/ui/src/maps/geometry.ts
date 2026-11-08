import type { RideCoordinates } from '@datxe/shared';
import type { MapBounds, MapViewportInsets } from './types';

export const DEFAULT_MAP_ZOOM = 16.5;
export const MAX_ROUTE_ZOOM = 18;
const ROUTE_BOUNDS_MARGIN = 0.0002;

export function goongStyleUrl(key?: string) {
  return key ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${encodeURIComponent(key)}` : undefined;
}

export function mapPadding(viewport?: MapViewportInsets) {
  return { top: (viewport?.top ?? 0) + 24, bottom: (viewport?.bottom ?? 0) + 24, left: 32, right: 32 };
}

export function mapBounds(points: readonly RideCoordinates[]): MapBounds | undefined {
  if (points.length < 2) return undefined;
  let [west, south, east, north] = [180, 90, -180, -90];
  for (const { lat, lng } of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [west - ROUTE_BOUNDS_MARGIN, south - ROUTE_BOUNDS_MARGIN, east + ROUTE_BOUNDS_MARGIN, north + ROUTE_BOUNDS_MARGIN];
}

export const lngLat = ({ lng, lat }: RideCoordinates): [number, number] => [lng, lat];
