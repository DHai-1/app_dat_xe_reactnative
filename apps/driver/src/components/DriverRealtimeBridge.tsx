import { env } from "@/config/env";
import { request } from "@/lib/api";
import {
  publishDriverLocation,
  restoreLastLocation,
  startDriverBackgroundLocation,
  startDriverLocationHeartbeat,
  stopDriverBackgroundLocation,
} from "@/lib/backgroundLocation";
import { driverRealtime } from "@/lib/realtime";
import { useSessionStore } from "@/lib/store";
import type { AuthProfile, CustomerRideDetail } from "@datxe/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDriverHealth } from '@/lib/driverHealth';

export function DriverRealtimeBridge() {
  const user = useSessionStore((state) => state.user);
  const client = useQueryClient();
  const ride = useQuery({
    queryKey: ["driver", "activeRide"],
    queryFn: () =>
      request<CustomerRideDetail>("/driver/rides/active", { allowNull: true }),
    enabled: Boolean(user),
    // Keep the chat badge correct even if a foreground STOMP/FCM frame was missed.
    refetchInterval: 10000,
  });
  const rideId = ride.data?.id;
  const userId = user?.id;
  const session = useQuery({
    queryKey: ["driver", "session"],
    queryFn: () => request<AuthProfile>("/auth/me"),
    enabled: Boolean(userId),
  });
  const availableOrBusy = user?.status === "ONLINE" || user?.status === "BUSY";
  const retryVersion = useDriverHealth(state => state.retryVersion);
  const refreshLocation = useRef<(() => void) | null>(null);
  // Profile and ride responses can update in either order when an offer is accepted.
  const tracking = Boolean(rideId) || availableOrBusy;
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      refreshLocation.current?.();
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    useSessionStore.getState().setActiveRide(ride.data ?? null);
  }, [ride.data]);
  useEffect(() => {
    if (!userId) return;
    const reconnect = driverRealtime.onConnection((connected) => {
      useDriverHealth.getState().update({ connected });
      if (connected) void client.invalidateQueries({ queryKey: ["driver"] });
    });
    driverRealtime.connect();
    return () => {
      reconnect();
      useDriverHealth.getState().update({ connected: false });
      void driverRealtime.disconnect();
    };
    // Chỉ kết nối lại khi đổi tài khoản; việc refetch session (đổi object user) không được
    // ngắt WebSocket vì sẽ làm mất heartbeat và bỏ lỡ offer.
  }, [userId, client]);
  useEffect(() => {
    if (!userId || !tracking) return;
    let cancelled = false;
    let checking = false;
    let foregroundPermissionAsked = false;
    let watcher: Location.LocationSubscription | undefined;
    let watcherStartedAt = 0;
    let lastWatchFixAt = 0;

    const ensureLocation = async (prompt: boolean) => {
      if (cancelled || checking || (AppState.currentState && AppState.currentState !== 'active')) return;
      checking = true;
      try {
        let foreground = await Location.getForegroundPermissionsAsync();
        if (!foreground.granted && foreground.canAskAgain && prompt && !foregroundPermissionAsked && !cancelled) {
          foregroundPermissionAsked = true;
          foreground = await Location.requestForegroundPermissionsAsync();
        }
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (cancelled) return;
        useDriverHealth.getState().update({ foregroundGranted: foreground.granted, servicesEnabled });
        if (!foreground.granted || !servicesEnabled) {
          watcher?.remove();
          watcher = undefined;
          throw new Error(foreground.granted ? 'Hãy bật dịch vụ vị trí/GPS của thiết bị.' : 'Cần quyền vị trí để nhận chuyến và chia sẻ vị trí.');
        }

        // A native watcher can silently stop emitting after the GPS provider is toggled.
        if (watcher && Date.now() - Math.max(watcherStartedAt, lastWatchFixAt) >= 30_000) {
          watcher.remove();
          watcher = undefined;
        }
        if (!watcher) {
          startDriverLocationHeartbeat();
          void restoreLastLocation().catch(() => {});
          void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false })
            .then(position => { if (!cancelled) void publishDriverLocation(position); })
            .catch(() => { /* The watcher and heartbeat can still recover a fix. */ });
          watcherStartedAt = Date.now();
          watcher = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: env.locationIntervalMs, distanceInterval: 0, mayShowUserSettingsDialog: false },
            position => {
              if (cancelled) return;
              if (Date.now() - position.timestamp < 30_000) lastWatchFixAt = Date.now();
              void publishDriverLocation(position);
            },
            error => {
              if (!cancelled) useDriverHealth.getState().update({ error });
            },
          );
          if (cancelled) { watcher.remove(); return; }
        }
        // Android can open a settings activity for this permission. Do not await it here.
        void startDriverBackgroundLocation().then(async backgroundRunning => {
          const permission = await Location.getBackgroundPermissionsAsync().catch(() => null);
          if (!cancelled) useDriverHealth.getState().update({
            backgroundRunning, ...(permission ? { backgroundGranted: permission.granted } : {}),
          });
        }).catch(() => {
          if (!cancelled) useDriverHealth.getState().update({ backgroundRunning: false });
        });
      } catch (error) {
        if (!cancelled) useDriverHealth.getState().update({ error: error instanceof Error ? error.message : 'Hãy kiểm tra quyền vị trí.' });
      } finally {
        checking = false;
      }
    };
    const refresh = () => { void ensureLocation(false); };
    refreshLocation.current = refresh;
    void ensureLocation(true);
    const timer = setInterval(refresh, 10_000);
    return () => {
      cancelled = true;
      refreshLocation.current = null;
      clearInterval(timer);
      watcher?.remove();
      void stopDriverBackgroundLocation().catch(() => {});
    };
  }, [userId, tracking, retryVersion]);
  useEffect(() => {
    if (!userId || tracking || !ride.isSuccess) return;
    // Also cleans up a native task left behind by a previous process.
    void stopDriverBackgroundLocation().catch(() => {});
    useDriverHealth.getState().update({ foregroundGranted: null, servicesEnabled: null, backgroundGranted: null, error: '' });
  }, [userId, tracking, ride.isSuccess]);
  useEffect(() => {
    if (session.data?.id === userId && session.data) useSessionStore.getState().setUser(session.data);
  }, [session.data, userId]);
  return null;
}
