import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  shadowStyle,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { BookingMap } from "@/components/map/BookingMap";
import { bookingStyles as base_s } from "../components/bookingStyles";
import { useMapPicker } from "../hooks/useMapPicker";

/** Ghim ở giữa bản đồ: dùng chung một kiểu marker cho điểm đón và điểm đến. */
const pinMarker = require("../../../../assets/images/marker-pin.png");
export default function MapPickerScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const h = useMapPicker();
  const pickup = h.kind === "pickup";
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(pickup ? "Đặt ghim điểm đón" : "Đặt ghim điểm đến")}
        onBack={() => h.router.back()}
      />
      <View style={s.flex}>
        <BookingMap
          center={h.center}
          editablePin
          onCenterChange={h.movePin}
          onReadyChange={h.setMapReady}
          onMovingChange={h.setMapMoving}
        />
        {h.mapReady ? (
          <View
            pointerEvents="none"
            style={[
              extra.item1,
              // Cả hai ghim đều có mũi nhọn ở đáy: đặt mũi đúng tâm bản đồ.
              { marginTop: -52 },
            ]}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={pinMarker}
              style={extra.pin}
            />
          </View>
        ) : null}
        <Pressable
          accessibilityLabel={i18nT("Đưa bản đồ về vị trí hiện tại")}
          onPress={() => void h.recenter()}
          style={[s.icon, extra.item2]}
        >
          {h.locating ? (
            <ActivityIndicator />
          ) : (
            <MaterialIcons
              name="my-location"
              size={24}
              color={colors.primary}
            />
          )}
        </Pressable>
        {h.mapReady ? (
          <View pointerEvents="none" style={extra.item3}>
            <Text style={extra.item4}>
              {i18nT("Di chuyển bản đồ, thả tay để chọn vị trí")}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[s.sheet, extra.item5]}>
        <View style={s.handle} />
        <Text style={s.label}>
          {i18nT(pickup ? "ĐIỂM ĐÓN ĐÃ GHIM" : "ĐIỂM ĐẾN ĐÃ GHIM")}
        </Text>
        {h.resolving ? (
          <View style={s.row}>
            <ActivityIndicator />
            <Text style={s.muted}>{i18nT("Đang xác định địa chỉ…")}</Text>
          </View>
        ) : (
          <>
            <Text numberOfLines={1} style={s.section}>
              {i18nT(h.place?.name ?? "Chọn vị trí trên bản đồ")}
            </Text>
            <Text numberOfLines={2} style={s.muted}>
              {h.place?.address ?? i18nT("Địa chỉ sẽ hiện khi bạn đặt ghim.")}
            </Text>
          </>
        )}
        {h.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {i18nT(h.error)}
          </Text>
        ) : null}
        <Pressable
          disabled={!h.canConfirm}
          onPress={h.confirm}
          style={[s.primary, !h.canConfirm && s.disabled]}
        >
          <Text style={s.primaryText}>
            {i18nT("Xác nhận")} {i18nT(pickup ? "điểm đón" : "điểm đến")}
          </Text>
        </Pressable>
        <Pressable onPress={() => h.router.back()} style={extra.item6}>
          <Text style={s.link}>{i18nT("Tìm địa chỉ bằng tên")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 52,
      height: 52,
      marginLeft: -26,
    },
    pin: { width: 52, height: 52 },
    item2: {
      position: "absolute",
      right: 20,
      bottom: 20,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    item3: {
      position: "absolute",
      top: 16,
      alignSelf: "center",
      backgroundColor: colors.inverseSurface80,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    item4: { color: colors.onScrim, fontSize: 13 },
    item5: { height: 260 },
    item6: { alignItems: "center", padding: 5 },
  });
