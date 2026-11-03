import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import {
  styles as base_styles,
  statusText,
} from "../components/FindDriverScreenParts";
import { useFindDriver } from "../hooks/useFindDriver";
export default function FindDriverScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, ride, error, cancelling, refresh, cancel } = useFindDriver();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Tìm tài xế")}
        backAccessibilityLabel={i18nT("Về trang chủ")}
        onBack={() => router.replace("/(tabs)/home")}
      />
      <View style={styles.content}>
        <View style={styles.icon}>
          <MaterialIcons name="search" size={40} color={colors.primary} />
        </View>
        <Text style={styles.status}>
          {i18nT(
            ride
              ? ride.type === "SCHEDULED" && ride.status === "PENDING"
                ? "Đã đặt lịch, đang chờ đến giờ tìm tài xế"
                : (statusText[ride.status] ?? ride.status)
              : "Đang tải trạng thái chuyến",
          )}
        </Text>
        {ride ? (
          <Text style={styles.meta}>
            {i18nT("Mã chuyến #")} {i18nT(ride.id)} ·{" "}
            {i18nT(
              ride.type === "INSTANT"
                ? "Chuyến ngay"
                : i18nT("Đón lúc {0}", {
                    "0": ride.scheduledAt
                      ? new Date(ride.scheduledAt).toLocaleString(getLocale())
                      : "theo lịch đã đặt",
                  }),
            )}
          </Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
        {ride ? (
          <View style={styles.route}>
            <Text style={styles.label}>{i18nT("ĐIỂM ĐÓN")}</Text>
            <Text style={styles.address}>
              {ride.pickupAddress || i18nT("Chưa có địa chỉ điểm đón")}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.label}>{i18nT("ĐIỂM ĐẾN")}</Text>
            <Text style={styles.address}>
              {ride.dropoffAddress || i18nT("Chưa có địa chỉ điểm đến")}
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{i18nT(error)}</Text> : null}
        <Pressable onPress={() => void refresh()} style={styles.secondary}>
          <Text style={styles.secondaryText}>
            {i18nT("Cập nhật trạng thái")}
          </Text>
        </Pressable>
        <Pressable
          disabled={
            !ride ||
            cancelling ||
            !["PENDING", "SEARCHING"].includes(ride.status)
          }
          onPress={cancel}
          style={[
            styles.cancel,
            (!ride ||
              cancelling ||
              !["PENDING", "SEARCHING"].includes(ride.status)) &&
              styles.disabled,
          ]}
        >
          {cancelling ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.cancelText}>{i18nT("Hủy yêu cầu")}</Text>
          )}
        </Pressable>
        {ride &&
        ["NO_DRIVER_FOUND", "EXPIRED", "CANCELLED"].includes(ride.status) ? (
          <Pressable
            onPress={() => router.replace("/(tabs)/home")}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>{i18nT("Về trang chủ")}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
