import type { AuthProfile, CustomerRideDetail, DriverLocationUpdate } from '@datxe/shared';
import { shouldPublishLocation, validLocationUpdate } from '@datxe/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { env } from '@/config/env';
import { request } from './api';
import { driverRealtime } from './realtime';
import { useDriverHealth } from './driverHealth';

export const DRIVER_LOCATION_TASK = 'datxe-driver-active-ride-location';
const HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_SAMPLE_AGE_MS = 30_000;
const LOCATION_POST_TIMEOUT_MS = 5_000;
let pendingLocationPost: { controller: AbortController; done: Promise<void> } | null = null;
let nativeTask = Promise.resolve();
let backgroundStart: Promise<boolean> | null = null;
const LAST_LOCATION_KEY = 'datxe.driver.lastLocation';
let previous: DriverLocationUpdate | null = null;
let needsRetry = false;
let lastKnown: DriverLocationUpdate | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let lastRideCheck = 0;
let active: boolean | null = null;
let locationEpoch = 0;
// Ask for background access at most once per app session; repeating the request
// flashes the system permission activity and re-triggers the location effect.
let backgroundPermissionAsked = false;
export function getFreshDriverCoordinates() {
  if (!lastKnown || Date.now() - Date.parse(lastKnown.timestamp) >= MAX_SAMPLE_AGE_MS) return null;
  return lastKnown.location;
}

export function publishDriverLocation(position: Location.LocationObject): Promise<void> | undefined {
  const next = { location: { lat: position.coords.latitude, lng: position.coords.longitude }, timestamp: new Date(position.timestamp).toISOString(), accuracy: position.coords.accuracy };
  if (!validLocationUpdate(next) || Date.now() - position.timestamp >= MAX_SAMPLE_AGE_MS) return;
  if (lastKnown && Date.parse(next.timestamp) <= Date.parse(lastKnown.timestamp)) return;
  lastKnown = next;
  useDriverHealth.getState().update({ lastSampleAt: position.timestamp });
  void AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(next)).catch(() => {});
  return sendLatestLocation();
}

function sendLatestLocation(): Promise<void> | undefined {
  if (pendingLocationPost) return pendingLocationPost.done;
  const update = lastKnown;
  if (!update || Date.now() - Date.parse(update.timestamp) >= MAX_SAMPLE_AGE_MS ||
      !shouldPublishLocation(previous, update, env.locationIntervalMs, needsRetry ? 0 : undefined)) return;
  previous = update;

  const epoch = locationEpoch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCATION_POST_TIMEOUT_MS);
  const done = request<boolean>('/driver/location', { method: 'POST', body: update, allowNull: true, signal: controller.signal })
    .then(accepted => {
      if (epoch !== locationEpoch) return;
      needsRetry = accepted !== true;
      if (!accepted) {
        if (useDriverHealth.getState().lastSentAt == null) {
          useDriverHealth.getState().update({ error: 'Máy chủ chưa xác nhận mẫu GPS. Đang chờ vị trí mới.' });
        }
        return;
      }
      // Readiness expires with the GPS fix, even if the network delivered it late.
      useDriverHealth.getState().update({ lastSentAt: Date.parse(update.timestamp), error: '' });
    })
    .catch(() => {
      if (epoch !== locationEpoch) return;
      needsRetry = true;
      useDriverHealth.getState().update({ error: 'Chưa xác nhận gửi được vị trí. Kiểm tra kết nối và thử lại.' });
      if (useDriverHealth.getState().connected && AppState.currentState === 'active' &&
          Date.now() - Date.parse(update.timestamp) < MAX_SAMPLE_AGE_MS) {
        // A socket can close between the health check and publish.
        try { driverRealtime.publish('/app/location', update); } catch { /* Retry with the next fix. */ }
      }
    })
    .finally(() => {
      clearTimeout(timer);
      if (pendingLocationPost?.controller !== controller) return;
      pendingLocationPost = null;
      // A newer fix may have arrived while the request was in flight.
      void sendLatestLocation();
    });
  pendingLocationPost = { controller, done };
  return done;
}

/**
 * Chỉ khôi phục mẫu GPS còn mới và giữ nguyên thời điểm đo, không làm mới tọa độ cũ.
 */
export async function restoreLastLocation(): Promise<void> {
  const epoch = locationEpoch;
  if (lastKnown) return; // GPS đã có vị trí mới hơn, không ghi đè bằng vị trí cũ.
  const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
  if (!raw || lastKnown || epoch !== locationEpoch) return;
  try {
    const stored: unknown = JSON.parse(raw);
    if (!validLocationUpdate(stored) || Date.now() - Date.parse(stored.timestamp) >= MAX_SAMPLE_AGE_MS) return;
    lastKnown = stored;
    useDriverHealth.getState().update({ lastSampleAt: Date.parse(stored.timestamp) });
    await sendLatestLocation();
  } catch {
    // Dữ liệu cũ/hỏng: bỏ qua và chờ GPS thật.
  }
}

/**
 * Lấy mẫu GPS thật khi đứng yên. Không đóng timestamp mới lên vị trí đã lưu.
 */
export function startDriverLocationHeartbeat() {
  if (heartbeat) return;
  const epoch = locationEpoch;
  let polling = false;
  heartbeat = setInterval(() => {
    if (polling || (AppState.currentState && AppState.currentState !== 'active')) return;
    // The watcher normally supplies both movement and stationary samples.
    if (lastKnown && Date.now() - Date.parse(lastKnown.timestamp) < HEARTBEAT_INTERVAL_MS) return;
    polling = true;
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false })
      .then(position => { if (epoch === locationEpoch) publishDriverLocation(position); })
      .catch(() => {
        if (epoch === locationEpoch && (!lastKnown || Date.now() - Date.parse(lastKnown.timestamp) >= MAX_SAMPLE_AGE_MS)) {
          useDriverHealth.getState().update({ error: 'Chưa lấy được GPS mới. Kiểm tra dịch vụ vị trí và quyền ứng dụng.' });
        }
      })
      .finally(() => { polling = false; });
  }, HEARTBEAT_INTERVAL_MS);
}
export function stopDriverLocationHeartbeat() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}
export async function stopDriverBackgroundLocation() {
  locationEpoch++;
  active = false; previous = null; lastKnown = null; needsRetry = false;
  pendingLocationPost?.controller.abort();
  pendingLocationPost = null;
  backgroundStart = null;
  useDriverHealth.getState().update({ lastSampleAt: null, lastSentAt: null, backgroundRunning: false });
  stopDriverLocationHeartbeat();
  if (Platform.OS === 'web') return;
  const stopping = nativeTask.then(async () => {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
  });
  nativeTask = stopping.catch(() => {});
  await stopping;
}

export function startDriverBackgroundLocation(): Promise<boolean> {
  active = true;
  lastRideCheck = Date.now();
  if (Platform.OS === 'web') return Promise.resolve(false);
  if (backgroundStart) return backgroundStart;
  const epoch = locationEpoch;
  const starting = (async () => {
    let permission = await Location.getBackgroundPermissionsAsync();
    if (epoch !== locationEpoch) return false;
    if (!permission.granted && permission.canAskAgain && !backgroundPermissionAsked) {
      backgroundPermissionAsked = true;
      permission = await Location.requestBackgroundPermissionsAsync();
    }
    if (!permission.granted || epoch !== locationEpoch) return false;
    // Serialize native operations only. A permission screen must never block foreground GPS or stop().
    const operation = nativeTask.then(async () => {
      if (epoch !== locationEpoch || AppState.currentState !== 'active') return false;
      if (!(await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK))) {
        await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
          accuracy: Location.Accuracy.High, timeInterval: env.locationIntervalMs, distanceInterval: 0,
          pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
          foregroundService: { notificationTitle: 'Đang chia sẻ vị trí tài xế', notificationBody: 'Vị trí dùng để tìm chuyến phù hợp hoặc theo dõi chuyến đang thực hiện.', killServiceOnDestroy: true },
        });
      }
      return epoch === locationEpoch;
    });
    nativeTask = operation.then(() => {}, () => {});
    return operation;
  })().finally(() => { if (backgroundStart === starting) backgroundStart = null; });
  backgroundStart = starting;
  return starting;
}
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) TaskManager.defineTask<{ locations: Location.LocationObject[] }>(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) { useDriverHealth.getState().update({ error: 'Chia sẻ vị trí nền gặp lỗi. Hãy mở app và kiểm tra lại GPS.' }); return; }
  if (!data?.locations?.length || active === false) return;
  const epoch = locationEpoch;
  try {
    // A cold background launch verifies that a ride is still assigned; never sends cached trip samples indefinitely.
    if (active === null || Date.now() - lastRideCheck > 30000) {
      const [ride, profile] = await Promise.all([request<CustomerRideDetail>('/driver/rides/active', { allowNull: true }), request<AuthProfile>('/auth/me')]);
      if (epoch !== locationEpoch) return;
      active = Boolean(ride || profile?.status === 'ONLINE' || profile?.status === 'BUSY'); lastRideCheck = Date.now();
      if (!active) { void stopDriverBackgroundLocation().catch(() => {}); return; }
    }
    if (epoch !== locationEpoch) return;
    await publishDriverLocation(data.locations.reduce((latest, point) => point.timestamp > latest.timestamp ? point : latest));
  } catch { /* Never publish after an auth/active-ride verification failure. */ }
});
