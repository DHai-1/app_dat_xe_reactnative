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
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

function isRideOffer(body: string): boolean {
  try {
    return JSON.parse(body)?.type === "RIDE_OFFER";
  } catch {
    return false;
  }
}

export function DriverRealtimeBridge() {
  const user = useSessionStore((state) => state.user);
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
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
    if (!userId) return;
    const unsubscribe = driverRealtime.subscribe("/user/queue/trip", (message) => {
      void client.invalidateQueries({ queryKey: ["driver"] });
      // Mở ngay màn nhận chuyến để tài xế không bỏ lỡ offer 15 giây, kể cả khi đang ở tab khác.
      if (isRideOffer(message.body) && pathnameRef.current !== "/ride/accept") {
        router.push("/ride/accept");
      }
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
    // Chỉ kết nối lại khi đổi tài khoản; việc refetch session (đổi object user) không được
    // ngắt WebSocket vì sẽ làm mất heartbeat và bỏ lỡ offer.
  }, [userId, client, router]);
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
      // Lấy ngay một vị trí hiện tại để có lastKnown cho heartbeat, kể cả khi GPS
      // không bắn callback ngay sau khi mở app.
      void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then(publishDriverLocation)
        .catch(() => {});
      void restoreLastLocation().catch(() => {});
      // Giữ heartbeat cho backend dù GPS không bắn callback khi tài xế đứng yên.
      startDriverLocationHeartbeat();
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
