import { ActivityIndicator } from "react-native-paper";
import { CustomerRideCancellationDialog } from "@/components/CustomerRideCancellationDialog";
import { CustomerNotice, customerType, RideEndpoints } from "@/components/CustomerRideUI";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as t } from "@datxe/shared";
import { Button, Card, ScreenWrapper, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, View } from "react-native";
import { statusText } from "../components/FindDriverScreenParts";
import { useFindDriver } from "../hooks/useFindDriver";

export default function FindDriverScreen() {
  useLanguage();
  const c = useThemeColors();
  const { router, ride, error, cancellation, refresh } = useFindDriver();
  const goHome = () => router.replace("/(tabs)/home");
  const scheduled = ride?.type === "SCHEDULED" && ride.status === "PENDING";
  const searching = ride?.status === "SEARCHING" || (ride?.status === "PENDING" && !scheduled);
  const ended = ride && ["NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM", "CANCELLED"].includes(ride.status);
  const canCancel = ride && ["PENDING", "SEARCHING"].includes(ride.status);
  return (
    <ScreenWrapper>
      <ScreenHeader title={t("Tìm tài xế")} backAccessibilityLabel={t("Về trang chủ")} onBack={goHome} />
      <ScrollView contentContainerStyle={styles.content}>
        {cancellation.error && !cancellation.visible ? <CustomerNotice>{t(cancellation.error)}</CustomerNotice> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{t(error)}</CustomerNotice> : null}
        {ride ? (
          <Card style={styles.card}>
            <View style={styles.header}>
              {searching ? <ActivityIndicator color={c.primary} /> : (
                <MaterialIcons name={ended ? "info-outline" : "schedule"} size={24}
                  color={ended ? c.error : c.onSurfaceVariant} />
              )}
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[customerType.heading, styles.title]}>
                {t(scheduled ? "Đã đặt lịch, đang chờ đến giờ tìm tài xế" : statusText[ride.status] ?? "Đang cập nhật trạng thái")}
              </Text>
            </View>
            {ride.scheduledAt ? (
              <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>
                {t("Đón lúc {0}", { "0": new Date(ride.scheduledAt).toLocaleString(getLocale()) })}
              </Text>
            ) : null}
            <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
          </Card>
        ) : !error ? <ActivityIndicator color={c.primary} accessibilityLabel={t("Đang tải trạng thái chuyến")} /> : null}
      </ScrollView>
      {canCancel || ended ? (
        <View style={[styles.footer, { backgroundColor: c.cardSurface }]}>
          {canCancel ? (
            <>
              {!error ? <Button variant="secondary" label="Cập nhật trạng thái" onPress={() => void refresh()} /> : null}
              <Button variant="ghost" contentColor={c.error} label="Hủy yêu cầu" onPress={cancellation.open} loading={cancellation.busy} />
            </>
          ) : <Button label="Về trang chủ" onPress={goHome} />}
        </View>
      ) : null}
      <CustomerRideCancellationDialog cancellation={cancellation} searching />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  card: { gap: 16, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1 },
  footer: { padding: 16, gap: 8 },
});
