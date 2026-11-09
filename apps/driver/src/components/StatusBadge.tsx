import { MaterialIcons } from "@expo/vector-icons";
import { Typography, useThemedStyles, type ThemeColors } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import {
  statusLabel,
  type StatusKind,
  type StatusTone,
} from "@/lib/displayLabels";

const icons = {
  neutral: "info-outline",
  pending: "schedule",
  active: "directions-car",
  success: "check-circle-outline",
  danger: "error-outline",
} as const;

export function StatusBadge({
  kind,
  value,
  contextLabel,
}: {
  kind: StatusKind;
  value: string | null | undefined;
  contextLabel?: string;
}) {
  const styles = useThemedStyles(badgeStyles);
  const status = statusLabel(kind, value);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        contextLabel ? `${contextLabel}: ${status.label}` : status.label
      }
      style={[styles.base, styles[status.tone]]}
    >
      <MaterialIcons
        name={icons[status.tone]}
        size={16}
        color={styles[`${status.tone}Text`].color}
        importantForAccessibility="no"
      />
      <Typography style={[styles.label, styles[`${status.tone}Text`]]}>
        {status.label}
      </Typography>
    </View>
  );
}

export const badgeColors = (
  c: ThemeColors,
): Record<StatusTone, { backgroundColor: string; color: string }> => ({
  neutral: { backgroundColor: c.surfaceContainerHigh, color: c.onSurface },
  pending: { backgroundColor: c.warningContainer, color: c.onWarningContainer },
  active: { backgroundColor: c.surfaceContainerHigh, color: c.onSurface },
  success: { backgroundColor: c.successContainer, color: c.onSuccessContainer },
  danger: { backgroundColor: c.errorContainer, color: c.onErrorContainer },
});
const badgeStyles = (c: ThemeColors) => {
  const tones = badgeColors(c);
  return StyleSheet.create({
    base: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    label: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
    neutral: { backgroundColor: tones.neutral.backgroundColor },
    neutralText: { color: tones.neutral.color },
    pending: { backgroundColor: tones.pending.backgroundColor },
    pendingText: { color: tones.pending.color },
    active: { backgroundColor: tones.active.backgroundColor },
    activeText: { color: tones.active.color },
    success: { backgroundColor: tones.success.backgroundColor },
    successText: { color: tones.success.color },
    danger: { backgroundColor: tones.danger.backgroundColor },
    dangerText: { color: tones.danger.color },
  });
};
