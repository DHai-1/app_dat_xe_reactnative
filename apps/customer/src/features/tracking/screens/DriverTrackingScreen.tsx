import { CustomerRideCancellationDialog } from "@/components/CustomerRideCancellationDialog";
import { CustomerNotice, customerType, MoneyText, RideEndpoints } from "@/components/CustomerRideUI";
import { HeaderIconButton } from "@/components/ScreenHeader";
import { BookingMap } from "@/components/map/BookingMap";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { chatStatuses, rideStatusLabel } from "@/lib/customerRidePresentation";
import { getLocale, translate as t } from "@datxe/shared";
import { Button, Card, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { DriverProfileCard } from "../components/DriverProfileCard";
import { assignedDriver } from "../driverProfile";
import { useDriverTracking } from "../hooks/useDriverTracking";

const fallbackCenter = { lat: 21.0285, lng: 105.8542 };

export default function DriverTrackingScreen() {
  useLanguage();
  const colors = useThemeColors();
  const { router, ride, vehicle, error, cancellation, refresh, pendingPickup, pendingDropoff, live, route } = useDriverTracking();
  const driver = ride ? assignedDriver(ride) : null;
  const pendingPhase = pendingDropoff && ride?.status === "VEHICLE_RETURNED" ? "dropoff"
    : pendingPickup && ride?.status === "VEHICLE_HANDOVER" ? "pickup" : null;
  const ended = ride && ["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(ride.status);
  const pickup = ride?.pickup.lat != null && ride.pickup.lng != null
    ? { coordinate: { lat: ride.pickup.lat, lng: ride.pickup.lng } } : null;
  const dropoff = ride?.dropoff.lat != null && ride.dropoff.lng != null
    ? { coordinate: { lat: ride.dropoff.lat, lng: ride.dropoff.lng } } : null;
  const goHome = () => router.replace("/(tabs)/home");
  const message = () => { if (ride) router.push({ pathname: "/chat", params: { rideId: String(ride.id) } }); };
  const canChat = Boolean(ride?.driverId && chatStatuses.includes(ride.status));

  return (
    <>
      <MapSheetLayout
        title={t("Theo dõi chuyến")}
        backAccessibilityLabel={ride ? "Mở chi tiết chuyến" : "Về trang chủ"}
        onBack={() => ride
          ? router.replace({ pathname: "/ride/[id]", params: { id: String(ride.id), rideId: String(ride.id), returnTo: "home" } })
          : goHome()}
        topActions={<HeaderIconButton icon="shield" accessibilityLabel="An toàn chuyến đi"
          onPress={() => router.push({ pathname: "/support", params: { topic: "safety", rideId: ride ? String(ride.id) : undefined } })} />}
        renderMap={viewport => (
          <BookingMap center={pickup?.coordinate ?? dropoff?.coordinate ?? fallbackCenter}
            pickup={pickup} dropoff={dropoff} route={route.length > 1 ? route : ride?.route?.coordinates}
            driver={ended ? null : live.sample?.location} viewport={viewport} />
        )}
        footer={(
          <>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite"
              style={customerType.heading}
            >{t(ride ? (rideStatusLabel[ride.status] ?? "Đang cập nhật trạng thái") : "Theo dõi chuyến")}</Text>
            {ride?.driverId && !ended ? (
              <Text style={[customerType.meta, { color: live.signalLost ? colors.error : colors.onSurfaceVariant }]}>
                {t(live.signalLost ? "Mất tín hiệu vị trí tài xế"
                  : live.sample ? "Vị trí tài xế đã cập nhật" : "Đang chờ vị trí tài xế…")}
              </Text>
            ) : null}
            {ride && pendingPhase ? (
              <Button label={pendingPhase === "pickup" ? "Xem và xác nhận bàn giao lúc đón" : "Xem và xác nhận hoàn trả xe"}
                onPress={() => router.push({ pathname: "/vehicle-inspection", params: { rideId: String(ride.id), phase: pendingPhase } })} />
            ) : ended && ride?.status !== "COMPLETED" ? <Button label="Về trang chủ" onPress={goHome} />
              : ride?.status === "COMPLETED" ? (
                <Button label="Xem tổng kết chuyến" onPress={() => router.navigate({
                  pathname: "/ride/completed", params: { rideId: String(ride.id) },
                })} />
              ) : null}
          </>
        )}
      >
        {!ride && !error ? <ActivityIndicator color={colors.primary} accessibilityLabel={t("Đang tải chuyến…")} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{t(error)}</CustomerNotice> : null}
        {ride ? (
          <>
            <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>
              {t("Chuyến #")} {ride.id}{ride.scheduledAt ? ` · ${new Date(ride.scheduledAt).toLocaleString(getLocale())}` : ""}
            </Text>
            {driver ? (
              <DriverProfileCard key={`${ride.id}:${driver.id}`} driver={driver} contactEnabled={canChat}
                unreadCount={ride.unreadChatCount} onMessage={message} />
            ) : (
              <Card style={styles.card}>
                <Text style={customerType.address}>{t(ride.driverId ? "Chưa tải được hồ sơ tài xế." : "Chuyến này đang chờ tài xế nhận.")}</Text>
                {ride.driverId ? <Button variant="secondary" label="Tải lại hồ sơ tài xế" onPress={() => void refresh()} /> : null}
              </Card>
            )}
            <Card style={styles.card}>
              <Text accessibilityRole="header" style={customerType.heading}>{t("Lộ trình")}</Text>
              <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
              <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>
                {[vehicle?.brand, vehicle?.model, ride.licensePlate || vehicle?.plate_number].filter(Boolean).join(" · ")
                  || t("Phương tiện #{0}", { "0": ride.vehicleId })}
              </Text>
              {!ended ? (
                <View style={styles.price}>
                  <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>{t("Giá dự kiến")}</Text>
                  <MoneyText value={ride.estimatedFare} style={styles.compactAmount} />
                </View>
              ) : null}
            </Card>
            {!error ? <Button variant="secondary" label="Làm mới trạng thái" onPress={() => void refresh()} /> : null}
            {cancellation.canCancel ? <Button variant="ghost" contentColor={colors.error} label="Hủy chuyến"
              onPress={cancellation.open} loading={cancellation.busy} /> : null}
          </>
        ) : null}
      </MapSheetLayout>
      <CustomerRideCancellationDialog cancellation={cancellation} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  price: { gap: 2 },
  compactAmount: { fontSize: 28, lineHeight: 35 },
});
