import { HeaderIconButton } from "@/components/ScreenHeader";
import { BookingMap } from "@/components/map/BookingMap";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { translate as t } from "@datxe/shared";
import { Button, Typography as Text, useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { MapPickerPin } from "../components/MapPickerPin";
import { bookingStyles } from "../components/bookingStyles";
import { useMapPicker } from "../hooks/useMapPicker";

export default function MapPickerScreen() {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(bookingStyles);
  const h = useMapPicker();
  const pickup = h.kind === "pickup";
  return (
    <MapSheetLayout
      initialSnap={0}
      title={t(pickup ? "Đặt ghim điểm đón" : "Đặt ghim điểm đến")}
      onBack={() => h.router.back()}
      topActions={(
        <HeaderIconButton icon="my-location" accessibilityLabel="Đưa bản đồ về vị trí hiện tại"
          onPress={() => { if (!h.locating) void h.recenter(); }} />
      )}
      renderMap={viewport => (
        <>
          <BookingMap
            center={h.center}
            cameraVersion={h.cameraVersion}
            viewport={viewport}
            editablePin
            onCenterChange={h.movePin}
            onReadyChange={h.setMapReady}
            onMovingChange={h.setMapMoving}
          />
          {h.mapReady ? <MapPickerPin moving={h.mapMoving} viewport={viewport} /> : null}
        </>
      )}
      footer={(
        <>
          <View style={styles.status}>
            {h.resolving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            <Text style={[s.muted, styles.statusText]} numberOfLines={1}>
              {h.resolving ? t("Đang lấy vị trí…") : h.place?.name ?? t("Chưa chọn địa điểm")}
            </Text>
          </View>
          <Button label={pickup ? "Xác nhận điểm đón" : "Xác nhận điểm đến"}
            disabled={!h.canConfirm} onPress={h.confirm} />
        </>
      )}
    >
      {h.error ? <Text accessibilityRole="alert" style={s.error}>{t(h.error)}</Text> : null}
      {h.retryable ? <Button variant="secondary" label="Thử lại" onPress={h.retry} /> : null}
      <Text style={s.section}>{t(pickup ? "Điểm đón đã ghim" : "Điểm đến đã ghim")}</Text>
      <Text style={s.text}>{h.place?.address ?? t("Địa chỉ sẽ hiện khi bạn đặt ghim.")}</Text>
      <Text style={s.muted}>{t("Di chuyển bản đồ, thả tay để chọn vị trí")}</Text>
      <Button variant="secondary" label="Tìm địa chỉ bằng tên" onPress={() => h.router.back()} />
    </MapSheetLayout>
  );
}

const styles = StyleSheet.create({
  // A fixed status slot keeps the collapsed sheet and map padding stable during lookups.
  status: { height: 32, flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { flex: 1 },
});
