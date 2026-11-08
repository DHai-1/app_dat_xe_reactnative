import { CustomerTabBar } from "@/components/CustomerTabBar";
import { CustomerNotice, customerType } from "@/components/CustomerRideUI";
import { HeaderIconButton } from "@/components/ScreenHeader";
import { HomeMap } from "@/components/map/HomeMap";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { translate as t } from "@datxe/shared";
import {
  Button, Card, MotionPressable as Pressable, ScreenWrapper,
  Typography as Text, useLanguage, useThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { getGreeting, getRideStatusLabel } from "../components/HomeScreenParts";
import { useHome } from "../hooks/useHome";

export default function HomeScreen() {
  useLanguage();
  const colors = useThemeColors();
  const [recenterToken, setRecenterToken] = useState(0);
  const h = useHome();
  const recenter = async () => {
    await h.refreshLocation(true);
    setRecenterToken(value => value + 1);
  };

  return (
    <ScreenWrapper edges={["bottom"]}>
      <MapSheetLayout
        insetBottom={false}
        initialSnap={0}
        snapPoints={["40%", "85%"]}
        contentStyle={styles.sheetContent}
        topActions={
          <>
            <HeaderIconButton icon="gps-fixed" accessibilityLabel="Về vị trí hiện tại"
              onPress={() => void recenter()} />
            <HeaderIconButton icon="shield" accessibilityLabel="An toàn chuyến đi"
              onPress={() => h.router.push({ pathname: "/support", params: { topic: "safety" } })} />
          </>
        }
        renderMap={viewport => (
          <HomeMap coordinate={h.currentCoordinates} drivers={h.nearbyDrivers}
            viewport={viewport} recenterToken={recenterToken} />
        )}
        footer={(
          <>
            {h.activeRide ? (
              <Text style={[customerType.meta, styles.center, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {t(getRideStatusLabel(h.activeRide.status))}
              </Text>
            ) : null}
            <Button icon={h.activeRide ? "arrow-forward" : "search"} iconPosition="leading"
              label={h.activeRide ? "Theo dõi chuyến đang hoạt động" : "Bạn muốn đi đâu?"}
              onPress={() => h.openBooking()} />
          </>
        )}
      >
        <Card style={styles.card}>
          <Text accessibilityRole="header" style={customerType.heading}>
            {t(getGreeting(h.currentHour))}, {h.greetingName}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Cập nhật vị trí hiện tại")}
            disabled={h.locationLoading} onPress={() => void h.refreshLocation(true)} style={styles.location}>
            <MaterialIcons color={colors.primary} name="place" size={22} />
            <Text numberOfLines={2} style={styles.address}>
              {t(h.locationLoading ? "Đang xác định vị trí…" : h.currentLocation)}
            </Text>
            {h.locationLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
          </Pressable>
        </Card>
        {!h.activeRide && h.nearbyStatus !== "location" ? (
          <CustomerNotice onRetry={h.nearbyStatus === "error" ? () => void h.retryNearby() : undefined}>
            {h.nearbyStatus === "error" ? t("Không tải được tài xế · Thử lại")
              : h.nearbyStatus === "loading" ? t("Đang tìm tài xế gần bạn…")
              : h.nearbyDrivers.length ? t("{0} tài xế gần bạn", { "0": h.nearbyDrivers.length })
              : t("Chưa có tài xế rảnh trong 5 km")}
          </CustomerNotice>
        ) : null}
        {h.loadError ? <CustomerNotice onRetry={() => void h.retryData()}>{t(h.loadError)}</CustomerNotice>
          : h.loading && !h.profile ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : null}
      </MapSheetLayout>
      <CustomerTabBar active="home" unreadCount={h.unreadCount} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  sheetContent: { paddingTop: 24 },
  card: { padding: 16, gap: 8 },
  location: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8 },
  address: { flex: 1, fontSize: 16, lineHeight: 22 },
  center: { textAlign: "center" },
  loading: { alignItems: "center", padding: 16 },
});
