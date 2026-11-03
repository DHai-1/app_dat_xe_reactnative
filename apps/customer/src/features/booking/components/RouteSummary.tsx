import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import type { BookingPlace } from "../types";
import { bookingStyles as base_s } from "./bookingStyles";
export function RouteSummary({
  pickup,
  dropoff,
  onPickup,
  onDropoff,
}: {
  pickup: BookingPlace | null;
  dropoff: BookingPlace | null;
  onPickup?: () => void;
  onDropoff?: () => void;
}) {
  const extra = useThemedStyles(extraStyles);

  const colors = useThemeColors();

  useLanguage();

  const s = useThemedStyles(base_s);

  return (
    <Card style={s.card}>
      {[
        {
          place: pickup,
          label: "ĐIỂM ĐÓN",
          color: colors.success,
          onPress: onPickup,
        },
        {
          place: dropoff,
          label: "ĐIỂM ĐẾN",
          color: colors.error,
          onPress: onDropoff,
        },
      ].map((item, index) => (
        <View key={item.label}>
          {index ? <View style={[s.divider, extra.item1]} /> : null}
          <Pressable
            disabled={!item.onPress}
            accessibilityRole={item.onPress ? "button" : undefined}
            onPress={item.onPress}
            style={[s.row, extra.item2]}
          >
            <MaterialIcons
              name={index ? "place" : "radio-button-checked"}
              size={22}
              color={item.color}
            />
            <View style={s.flex}>
              <Text style={s.label}>{i18nT(item.label)}</Text>
              <Text style={s.text} numberOfLines={2}>
                {item.place?.address ?? i18nT("Chưa chọn địa điểm")}
              </Text>
            </View>
            {item.onPress ? (
              <MaterialIcons
                name="edit"
                size={18}
                color={colors.onSurfaceVariant}
              />
            ) : null}
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { marginLeft: 34 },
    item2: { paddingVertical: 4 },
  });
