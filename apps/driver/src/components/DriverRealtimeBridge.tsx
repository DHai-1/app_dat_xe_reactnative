import { env } from "@/config/env";
import { request } from "@/lib/api";
import {
  publishDriverLocation,
  startDriverBackgroundLocation,
  stopDriverBackgroundLocation,
} from "@/lib/backgroundLocation";
import { driverRealtime } from "@/lib/realtime";
import { useSessionStore } from "@/lib/store";
import type { CustomerRideDetail } from "@datxe/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect } from "react";
import { Alert } from "react-native";

export function DriverRealtimeBridge() {
  const user = useSessionStore((state) => state.user);
  const client = useQueryClient();
  const ride = useQuery({
    queryKey: ["driver", "activeRide"],
    queryFn: () =>
      request<CustomerRideDetail>("/driver/rides/active", { allowNull: true }),
    enabled: Boolean(user),
  });
  const rideId = ride.data?.id;
  const userId = user?.id;
  const online = user?.status === "ONLINE";
  useEffect(() => {
    useSessionStore.getState().setActiveRide(ride.data ?? null);
  }, [ride.data]);
  useEffect(() => {
    if (!user) return;
    const unsubscribe = driverRealtime.subscribe("/user/queue/trip", () => {
      void client.invalidateQueries({ queryKey: ["driver"] });
    });
    const reconnect = driverRealtime.onConnection((connected) => {
      if (connected) void client.invalidateQueries({ queryKey: ["driver"] });
    });
    driverRealtime.connect();
    return () => {
      unsubscribe();
      reconnect();
      void driverRealtime.disconnect();
    };
  }, [user, client]);
  useEffect(() => {
    if (!userId || (!rideId && !online)) {
      void stopDriverBackgroundLocation().catch(() => {});
      return;
    }
    let cancelled = false;
    let watcher: Location.LocationSubscription | undefined;
    void (async () => {
      if (!(await Location.requestForegroundPermissionsAsync()).granted)
        throw new Error("Cần quyền vị trí để khách theo dõi chuyến.");
      if (cancelled) return;
      const background = rideId
        ? await startDriverBackgroundLocation().catch(() => false)
        : false;
      if (cancelled) {
        await stopDriverBackgroundLocation();
        return;
      }
      if (!background) {
        watcher = await Location.watchPositionAsync(
          {
            accuracy: rideId
              ? Location.Accuracy.High
              : Location.Accuracy.Balanced,
            timeInterval: env.locationIntervalMs,
            distanceInterval: 0,
          },
          publishDriverLocation,
        );
        if (cancelled) watcher.remove();
        if (rideId)
          Alert.alert(
            "Vị trí khi chạy nền chưa bật",
            "Khách chỉ nhận vị trí khi app đang mở. Cho phép vị trí nền trong cài đặt để tiếp tục chia sẻ khi mở chỉ đường.",
          );
      }
    })().catch((error) => {
      if (!cancelled)
        Alert.alert(
          "Chưa thể chia sẻ vị trí",
          error instanceof Error ? error.message : "Hãy kiểm tra quyền vị trí.",
        );
    });
    return () => {
      cancelled = true;
      watcher?.remove();
      void stopDriverBackgroundLocation().catch(() => {});
    };
  }, [userId, rideId, online]);
  return null;
}
