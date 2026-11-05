import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { BookingMap } from "@/components/map/BookingMap";
import {
  Action,
  styles as base_styles,
  cancellableStatuses,
  chatStatuses,
  rideStatusLabel,
} from "../components/DriverTrackingScreenParts";
import { useDriverTracking } from "../hooks/useDriverTracking";
import { DriverProfileCard } from "../components/DriverProfileCard";
import { assignedDriver } from "../driverProfile";
export default function DriverTrackingScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    ride,
    vehicle,
    error,
    cancelling,
    refresh,
    pendingPickup,
    pendingDropoff,
    cancel,
    live,
  } = useDriverTracking();
  const driver = ride ? assignedDriver(ride) : null;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Theo dõi chuyến")}
        backAccessibilityLabel={i18nT("Mở chi tiết chuyến")}
        onBack={() =>
          ride &&
          router.replace({
            pathname: "/ride/[id]",
            params: {
              id: String(ride.id),
              rideId: String(ride.id),
              returnTo: "home",
            },
          })
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!ride ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.meta}>{i18nT("Đang tải chuyến…")}</Text>
          </View>
        ) : (
          <>
            {ride.pickup.lat !== null &&
            ride.pickup.lng !== null &&
            ride.dropoff.lat !== null &&
            ride.dropoff.lng !== null ? (
              <View style={extra.item1}>
                <BookingMap
                  center={{ lat: ride.pickup.lat, lng: ride.pickup.lng }}
                  pickup={{
                    coordinate: { lat: ride.pickup.lat, lng: ride.pickup.lng },
                  }}
                  dropoff={{
                    coordinate: {
                      lat: ride.dropoff.lat,
                      lng: ride.dropoff.lng,
                    },
                  }}
                  route={ride.route?.coordinates}
                  driver={live.sample?.location}
                />
              </View>
            ) : null}
            {ride.driverId ? (
              <Card style={styles.card}>
                <Text
                  accessibilityRole="alert"
                  style={[styles.body, live.signalLost && extra.item2]}
                >
                  {i18nT(
                    live.signalLost
                      ? "Mất tín hiệu vị trí tài xế"
                      : live.sample
                        ? "Vị trí tài xế đang cập nhật trực tiếp"
                        : "Đang chờ vị trí tài xế…",
                  )}
                </Text>
                {live.sample ? (
                  <Text style={styles.meta}>
                    GPS ±{i18nT(Math.round(live.sample.accuracy))}{" "}
                    {i18nT("m · Cập nhật")}{" "}
                    {i18nT(
                      new Date(live.sample.timestamp).toLocaleTimeString(
                        getLocale(),
                      ),
                    )}
                  </Text>
                ) : null}
              </Card>
            ) : null}
            <View style={styles.statusCard}>
              <MaterialIcons
                name="directions-car"
                size={30}
                color={colors.primary}
              />
              <Text style={styles.status}>
                {i18nT(rideStatusLabel[ride.status] ?? ride.status)}
              </Text>
              <Text style={styles.meta}>
                {i18nT("Mã chuyến #")} {i18nT(ride.id)} {i18nT("· Cập nhật")}{" "}
                {i18nT(
                  new Date(ride.updatedAt).toLocaleTimeString(getLocale(), {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                )}
              </Text>
              {ride.type === "SCHEDULED" && ride.scheduledAt ? (
                <Text style={styles.meta}>
                  {i18nT("Giờ hẹn:")}{" "}
                  {i18nT(
                    new Date(ride.scheduledAt).toLocaleString(getLocale()),
                  )}
                </Text>
              ) : null}
            </View>
            {driver ? (
              <DriverProfileCard
                key={`${ride.id}:${driver.id}`}
                driver={driver}
                contactEnabled={chatStatuses.includes(ride.status)}
                unreadCount={ride.unreadChatCount}
                onMessage={() => router.push({ pathname: '/chat', params: { rideId: String(ride.id) } })}
              />
            ) : (
              <Card style={styles.card}>
                <Text style={styles.section}>{i18nT('Thông tin tài xế')}</Text>
                <Text style={styles.body}>{i18nT(ride.driverId ? 'Chưa tải được hồ sơ tài xế.' : 'Chuyến này đang chờ tài xế nhận.')}</Text>
                {ride.driverId ? <Action label={i18nT('Tải lại hồ sơ tài xế')} onPress={() => void refresh()} /> : null}
              </Card>
            )}
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Xe của bạn")}</Text>
              <Text style={styles.body}>
                {i18nT(
                  vehicle
                    ? [vehicle.brand, vehicle.model]
                        .filter(Boolean)
                        .join(" ") ||
                        vehicle.vehicle_type ||
                        i18nT("Xe")
                    : i18nT("Phương tiện #{0}", { "0": ride.vehicleId }),
                )}
              </Text>
              <Text style={styles.meta}>
                {vehicle?.plate_number || i18nT("Chưa có biển số")}
              </Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Lộ trình")}</Text>
              <Text style={styles.label}>{i18nT("ĐIỂM ĐÓN")}</Text>
              <Text style={styles.body}>
                {ride.pickupAddress || i18nT("Không có địa chỉ")}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.label}>{i18nT("ĐIỂM ĐẾN")}</Text>
              <Text style={styles.body}>
                {ride.dropoffAddress || i18nT("Không có địa chỉ")}
              </Text>
              <Text style={styles.meta}>
                {i18nT("Giá dự kiến:")}{" "}
                {i18nT(
                  new Intl.NumberFormat(getLocale()).format(ride.estimatedFare),
                )}{" "}
                {i18nT("đ")}
              </Text>
            </Card>
            {ride.driverId && chatStatuses.includes(ride.status) ? (
              <Action
                label={i18nT(
                  ride.unreadChatCount > 0
                    ? i18nT("Nhắn tin với tài xế · {0} tin chưa đọc", {
                        "0": ride.unreadChatCount,
                      })
                    : "Nhắn tin với tài xế",
                )}
                onPress={() =>
                  router.push({
                    pathname: "/chat",
                    params: { rideId: String(ride.id) },
                  } as never)
                }
              />
            ) : null}
            {pendingPickup ? (
              <Action
                label={i18nT("Xem và xác nhận bàn giao lúc đón")}
                onPress={() =>
                  router.push({
                    pathname: "/vehicle-inspection",
                    params: { rideId: String(ride.id), phase: "pickup" },
                  })
                }
              />
            ) : null}
            {pendingDropoff ? (
              <Action
                label={i18nT("Xem và xác nhận hoàn trả xe")}
                onPress={() =>
                  router.push({
                    pathname: "/vehicle-inspection",
                    params: { rideId: String(ride.id), phase: "dropoff" },
                  })
                }
              />
            ) : null}
            {["CANCELLED", "NO_DRIVER_FOUND", "EXPIRED"].includes(
              ride.status,
            ) ? (
              <Action
                label={i18nT("Về trang chủ")}
                onPress={() => router.replace("/(tabs)/home")}
              />
            ) : null}
            <Pressable onPress={() => void refresh()} style={styles.secondary}>
              <Text style={styles.secondaryText}>
                {i18nT("Làm mới trạng thái")}
              </Text>
            </Pressable>
            {cancellableStatuses.includes(ride.status) ? (
              <Pressable
                disabled={cancelling}
                onPress={cancel}
                style={styles.cancel}
              >
                {cancelling ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <Text style={styles.cancelText}>{i18nT("Hủy chuyến")}</Text>
                )}
              </Pressable>
            ) : null}
          </>
        )}
        {error ? <Text style={styles.error}>{i18nT(error)}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: { height: 300, borderRadius: 20, overflow: "hidden" },
    item2: { color: colors.error },
  });
