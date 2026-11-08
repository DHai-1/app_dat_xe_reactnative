import { translate as t } from "@datxe/shared";
import { MotionPressable as Pressable, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import type { BookingPlace } from "../types";

function shortAddress(place: BookingPlace) {
  const parts = place.address.split(",").map(part => part.trim()).filter(Boolean);
  const street = parts.find(part =>
    /^(?:\d+[\p{L}\d/.-]*\s+)?(?:đường\s|đ\.\s*|phố\s|ngõ\s|ngách\s|quốc lộ\s|ql\.?\s*)/iu.test(part),
  );
  return street ?? parts[0] ?? place.name;
}

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
  useLanguage();
  const colors = useThemeColors();
  const stops = [
    { place: pickup, label: t("Điểm đón"), color: colors.primary, onPress: onPickup },
    { place: dropoff, label: t("Điểm đến"), color: colors.error, onPress: onDropoff },
  ];

  return (
    <View>
      {stops.map(({ place, label, color, onPress }, index) => {
        const address = place ? shortAddress(place) : t("Chưa chọn địa điểm");
        return (
          <Pressable
            key={label}
            disabled={!onPress}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={`${label}, ${place?.address || address}`}
            onPress={onPress}
            style={styles.stop}
          >
            <View style={styles.rail}>
              <View style={[styles.line, index === 1 && { backgroundColor: colors.outlineVariant }]} />
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={[styles.line, index === 0 && { backgroundColor: colors.outlineVariant }]} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
              <Text style={styles.address} numberOfLines={1}>{address}</Text>
            </View>
            {onPress ? <MaterialIcons name="edit" size={18} color={colors.onSurfaceVariant} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stop: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 },
  rail: { alignSelf: "stretch", width: 12, alignItems: "center" },
  line: { width: 1, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  copy: { flex: 1, paddingVertical: 4 },
  label: { fontSize: 12, lineHeight: 16 },
  address: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
});
