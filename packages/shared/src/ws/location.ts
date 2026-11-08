import type { RideCoordinates } from '../types';
export type DriverLocationUpdate = { location: RideCoordinates; timestamp: string; accuracy: number | null; receivedAt?: string };
export function validLocationUpdate(value: unknown, now = Date.now()): value is DriverLocationUpdate {
  const point = value as DriverLocationUpdate | null;
  const time = Date.parse(point?.timestamp ?? '');
  return Boolean(point && Number.isFinite(point.location?.lat) && Math.abs(point.location.lat) <= 90 && Number.isFinite(point.location?.lng) && Math.abs(point.location.lng) <= 180 && (point.accuracy === null || (Number.isFinite(point.accuracy) && point.accuracy >= 0 && point.accuracy <= 10000)) && Number.isFinite(time) && time <= now + 30000 && time >= now - 120000);
}
export function shouldPublishLocation(previous: DriverLocationUpdate | null, next: DriverLocationUpdate, intervalMs = 4000, minDistanceMeters = 10): boolean {
  if (!validLocationUpdate(next)) return false;
  if (!previous) return true;
  const elapsed = Date.parse(next.timestamp) - Date.parse(previous.timestamp);
  if (elapsed < intervalMs) return false;
  const toRad = Math.PI / 180;
  const a = Math.sin((next.location.lat - previous.location.lat) * toRad / 2) ** 2 + Math.cos(previous.location.lat * toRad) * Math.cos(next.location.lat * toRad) * Math.sin((next.location.lng - previous.location.lng) * toRad / 2) ** 2;
  const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - Math.min(1, a)));
  return distance >= minDistanceMeters || elapsed >= 12000;
}
export function locationSignalLost(lastReceived: number | null, startedAt: number, now: number, timeoutMs: number): boolean { return now - (lastReceived ?? startedAt) > timeoutMs; }
export function stompBrokerUrl(apiUrl: string): string { return apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws-location'; }
