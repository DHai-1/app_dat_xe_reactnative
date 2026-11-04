import type { RideCoordinates } from '@datxe/shared';
import { router } from 'expo-router';
export function externalDirectionsUrl(point: { lat: number | null; lng: number | null }) {
  if (point.lat === null || point.lng === null || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) throw new Error('Điểm chỉ đường chưa có tọa độ hợp lệ.');
  return '';
}
export function openExternalDirections(point: RideCoordinates | { lat: number | null; lng: number | null }, address = '') {
  if (point.lat === null || point.lng === null || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
  // Keep this legacy function name for callers that have not migrated yet,
  // but always stay inside the driver app instead of opening Google Maps.
  router.push({ pathname: '/ride/directions', params: { lat: String(point.lat), lng: String(point.lng), address } } as never);
}
