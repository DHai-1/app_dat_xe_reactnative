import {
  getLocale,
  translate as i18nT,
  type CustomerRideSummary,
} from "@datxe/shared";
import {
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import {
  styles as createStyles,
  labelForStatus,
  money,
} from "./TripHistoryScreenParts";

export function HistoryRideListItem({
  ride,
  onPress,
}: {
  ride: CustomerRideSummary;
  onPress: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.ride}>
      <View style={styles.rideHeader}>
        <View style={styles.rideTitleRow}>
          <MaterialIcons
            name="directions-car"
            size={22}
            color={colors.primary}
          />
          <Text style={styles.rideTitle}>
            {i18nT("Chuyến #")} {i18nT(ride.id)}
          </Text>
        </View>
        <Text
          style={[
            styles.status,
            ride.status === "CANCELLED" && styles.statusCancelled,
          ]}
        >
          {i18nT(labelForStatus[ride.status] ?? "Đang cập nhật trạng thái")}
        </Text>
      </View>
      <Text style={styles.meta}>
        {i18nT(new Date(ride.createdAt).toLocaleString(getLocale()))} ·{" "}
        {i18nT(
          ride.type === "INSTANT"
            ? "Đặt ngay"
            : i18nT("Đón lúc {0}", {
                "0": ride.scheduledAt
                  ? new Date(ride.scheduledAt).toLocaleString(getLocale())
                  : "theo lịch",
              }),
        )}
      </Text>
      <View style={styles.addressRow}>
        <Text style={styles.pin}>{i18nT("Đón:")}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {ride.pickupAddress || i18nT("Chưa có địa chỉ")}
        </Text>
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.pin}>{i18nT("Đến:")}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {ride.dropoffAddress || i18nT("Chưa có địa chỉ")}
        </Text>
      </View>
      <View style={styles.rideFooter}>
        {ride.status !== "CANCELLED" || ride.finalFare != null ? (
          <View style={styles.fareCopy}>
            <Text style={styles.meta}>{i18nT(ride.finalFare == null ? "Giá dự kiến" : "Cước chuyến đi")}</Text>
            <Text style={styles.fare}>{i18nT(money(ride.finalFare ?? ride.estimatedFare))}</Text>
          </View>
        ) : <View style={styles.fareCopy} />}
        <MaterialIcons
          name="chevron-right"
          size={23}
          color={colors.onSurfaceVariant}
        />
      </View>
    </Pressable>
  );
}
