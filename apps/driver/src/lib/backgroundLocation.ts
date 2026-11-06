import type { CustomerRideDetail, DriverLocationUpdate } from '@datxe/shared';
import { shouldPublishLocation, validLocationUpdate } from '@datxe/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { request } from './api';
import { driverRealtime } from './realtime';

export const DRIVER_LOCATION_TASK = 'datxe-driver-active-ride-location';
const HEARTBEAT_INTERVAL_MS = 10_000;
const LAST_LOCATION_KEY = 'datxe.driver.lastLocation';
let previous: DriverLocationUpdate | null = null;
let lastKnown: DriverLocationUpdate | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let lastRideCheck = 0;
let active = false;
export function publishDriverLocation(position: Location.LocationObject) {
  if (position.coords.accuracy === null) return;
  const next = { location: { lat: position.coords.latitude, lng: position.coords.longitude }, timestamp: new Date(position.timestamp).toISOString(), accuracy: position.coords.accuracy };
  if (!validLocationUpdate(next)) return;
  lastKnown = next;
  void AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat: next.location.lat, lng: next.location.lng, accuracy: next.accuracy }));
  const shouldPublish = shouldPublishLocation(previous, next, env.locationIntervalMs);
  const sent = shouldPublish ? driverRealtime.publish('/app/location', next, 10000) : false;
  if (shouldPublish && sent) previous = next;
}

/**
 * Khôi phục vị trí lần cuối sau khi app khởi động lại. GPS có thể mất vài giây mới có fix;
 * backend chỉ giữ driver:alive 30 giây nên nếu chờ GPS, tài xế sẽ tạm rơi khỏi danh sách ứng viên.
 */
export async function restoreLastLocation(): Promise<void> {
  if (lastKnown) return; // GPS đã có vị trí mới hơn, không ghi đè bằng vị trí cũ.
  const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
  if (!raw || lastKnown) return;
  try {
    const stored = JSON.parse(raw) as { lat?: number; lng?: number; accuracy?: number } | null;
    if (!stored || !Number.isFinite(stored.lat) || !Number.isFinite(stored.lng)) return;
    lastKnown = {
      location: { lat: stored.lat as number, lng: stored.lng as number },
      timestamp: new Date().toISOString(),
      accuracy: stored.accuracy ?? 20,
    };
    driverRealtime.publish('/app/location', lastKnown, 10000);
  } catch {
    // Dữ liệu cũ/hỏng: bỏ qua và chờ GPS thật.
  }
}

/**
 * GPS không phải lúc nào cũng bắn callback khi tài xế đứng yên (hoặc trên emulator),
 * trong khi backend chỉ giữ driver:alive 30 giây. Gửi lại vị trí đã biết mỗi 10 giây
 * với timestamp mới để tài xế không bị rơi khỏi danh sách ứng viên khi không di chuyển.
 */
export function startDriverLocationHeartbeat() {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    if (!lastKnown) return;
    driverRealtime.publish(
      '/app/location',
      { ...lastKnown, timestamp: new Date().toISOString() },
      10000,
    );
  }, HEARTBEAT_INTERVAL_MS);
}
export function stopDriverLocationHeartbeat() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}
export async function stopDriverBackgroundLocation() {
  active = false; previous = null; lastKnown = null;
  stopDriverLocationHeartbeat();
  if (Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
}
export async function startDriverBackgroundLocation(): Promise<boolean> {
  active = true; lastRideCheck = Date.now();
  if (Platform.OS === 'web') return false;
  if (!(await Location.requestBackgroundPermissionsAsync()).granted) return false;
  if (!active) return false;
  if (!(await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK))) await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.High, timeInterval: env.locationIntervalMs, distanceInterval: 0,
    pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Đang chia sẻ vị trí chuyến đi', notificationBody: 'Vị trí được gửi cho khách trong chuyến đang hoạt động.', killServiceOnDestroy: true },
  });
  return true;
}
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) TaskManager.defineTask<{ locations: Location.LocationObject[] }>(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    // A cold background launch verifies that a ride is still assigned; never sends cached trip samples indefinitely.
    if (!active || Date.now() - lastRideCheck > 30000) {
      active = Boolean(await request<CustomerRideDetail>('/driver/rides/active', { allowNull: true })); lastRideCheck = Date.now();
      if (!active) { await stopDriverBackgroundLocation(); return; }
    }
    driverRealtime.connect();
    publishDriverLocation(data.locations.reduce((latest, point) => point.timestamp > latest.timestamp ? point : latest));
  } catch { /* Never publish after an auth/active-ride verification failure. */ }
});
