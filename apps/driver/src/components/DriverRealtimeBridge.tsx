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
import type { CustomerRideDetail } from "@datxe/shared";
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
    refetchInterval: query => query.state.data ? 10000 : false,
  });
  const rideId = ride.data?.id;
  const userId = user?.id;
  const online = user?.status === "ONLINE";
  const retryVersion = useDriverHealth(state => state.retryVersion);
  const teardown = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state === 'active') useDriverHealth.getState().retry(); });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    useSessionStore.getState().setActiveRide(ride.data ?? null);
  }, [ride.data]);
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = driverRealtime.subscribe("/user/queue/trip", () => {
      void client.invalidateQueries({ queryKey: ["driver"] });
      // PushBridge validates/deduplicates offers from STOMP and FCM before routing.
    });
    const reconnect = driverRealtime.onConnection((connected) => {
      useDriverHealth.getState().update({ connected });
      if (connected) void client.invalidateQueries({ queryKey: ["driver"] });
    });
    driverRealtime.connect();
    return () => {
      unsubscribe();
      reconnect();
      void driverRealtime.disconnect();
    };
    // Chỉ kết nối lại khi đổi tài khoản; việc refetch session (đổi object user) không được
    // ngắt WebSocket vì sẽ làm mất heartbeat và bỏ lỡ offer.
  }, [userId, client]);
  useEffect(() => {
    if (!userId || (!rideId && !online)) {
      teardown.current = teardown.current.then(stopDriverBackgroundLocation).catch(() => {});
      return;
    }
    let cancelled = false;
    let watcher: Location.LocationSubscription | undefined;
    const previousTeardown = teardown.current;
    const setup = (async () => {
      await previousTeardown;
      if (cancelled) return;
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      useDriverHealth.getState().update({ foregroundGranted: foreground.granted, servicesEnabled, error: '' });
      if (!foreground.granted) throw new Error("Cần quyền vị trí để nhận chuyến và chia sẻ vị trí.");
      if (!servicesEnabled) throw new Error('Hãy bật dịch vụ vị trí/GPS của thiết bị.');
      if (cancelled) return;
      const background = await startDriverBackgroundLocation().catch(() => false);
      const backgroundPermission = await Location.getBackgroundPermissionsAsync();
      if (cancelled) return;
      useDriverHealth.getState().update({ backgroundRunning: background, backgroundGranted: backgroundPermission.granted });
      if (!background) {
        watcher = await Location.watchPositionAsync(
          {
            accuracy: rideId
              ? Location.Accuracy.High
              : Location.Accuracy.Balanced,
            timeInterval: env.locationIntervalMs,
            distanceInterval: 0,
          },
          position => { if (!cancelled) publishDriverLocation(position); },
        );
        if (cancelled) watcher.remove();
      }
      if (cancelled) return;
      // Lấy ngay một vị trí hiện tại để có lastKnown cho heartbeat, kể cả khi GPS
      // không bắn callback ngay sau khi mở app.
      void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then(position => { if (!cancelled) publishDriverLocation(position); })
        .catch(() => {});
      void restoreLastLocation().catch(() => {});
      // Giữ heartbeat cho backend dù GPS không bắn callback khi tài xế đứng yên.
      startDriverLocationHeartbeat();
    })().catch((error) => {
      if (!cancelled) useDriverHealth.getState().update({ error: error instanceof Error ? error.message : 'Hãy kiểm tra quyền vị trí.' });
    });
    return () => {
      cancelled = true;
      watcher?.remove();
      teardown.current = setup.then(stopDriverBackgroundLocation).catch(() => {});
    };
  }, [userId, rideId, online, retryVersion]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const check = async () => {
      try {
        const [foreground, background, servicesEnabled, backgroundRunning] = await Promise.all([
          Location.getForegroundPermissionsAsync(), Location.getBackgroundPermissionsAsync(),
          Location.hasServicesEnabledAsync(), Location.hasStartedLocationUpdatesAsync('datxe-driver-active-ride-location'),
        ]);
        if (!cancelled) useDriverHealth.getState().update({ foregroundGranted: foreground.granted, backgroundGranted: background.granted, servicesEnabled, backgroundRunning });
      } catch { /* Setup errors remain visible in the status card. */ }
    };
    void check();
    const timer = setInterval(() => void check(), 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [userId]);
  return null;
}
