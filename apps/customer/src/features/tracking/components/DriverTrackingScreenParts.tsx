import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  borderRadius,
  Button,
  spacing,
  typography,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet } from "react-native";
export const rideStatusLabel: Record<string, string> = {
  PENDING: "Đang tiếp nhận yêu cầu",
  SEARCHING: "Đang tìm tài xế",
  DRIVER_ASSIGNED: "Tài xế đã nhận chuyến",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
  VEHICLE_HANDOVER: "Đang bàn giao xe",
  IN_PROGRESS: "Chuyến đi đang diễn ra",
  ARRIVED_DESTINATION: "Đã đến điểm trả",
  VEHICLE_RETURNED: "Đang hoàn tất bàn giao xe",
  COMPLETED: "Chuyến đi hoàn thành",
  CANCELLED: "Chuyến đi đã hủy",
  NO_DRIVER_FOUND: "Không tìm thấy tài xế",
  EXPIRED: "Yêu cầu đã hết hạn",
};

export const cancellableStatuses = [
  "PENDING",
  "SEARCHING",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
];

export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];

export function Action({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();

  return (
    <Button
      onPress={onPress}
      style={themed_styles.primary}
      label={i18nT(label)}
      textStyle={themed_styles.primaryText}
    />
  );
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 13, paddingBottom: 34 },
    loading: { alignItems: "center", gap: 12, padding: 28 },
    statusCard: {
      alignItems: "center",
      gap: 9,
      backgroundColor: colors.primaryFixedTint,
      borderRadius: borderRadius.lg,
      padding: 20,
    },
    status: {
      ...typography.headlineSm,
      color: colors.onSurface,
      textAlign: "center",
    },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.lg,
      padding: 16,
      gap: 8,
    },
    section: { ...typography.labelLg, color: colors.onSurface },
    body: { ...typography.bodyMd, color: colors.onSurface },
    note: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    label: { ...typography.labelSm, color: colors.primary },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 3,
    },
    primary: {
      minHeight: 50,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    primaryText: { ...typography.labelLg, color: colors.onPrimary },
    secondary: { alignItems: "center", padding: 12 },
    secondaryText: { ...typography.labelLg, color: colors.primary },
    cancel: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: { ...typography.labelLg, color: colors.error },
    error: { ...typography.bodyMd, color: colors.error, textAlign: "center" },
  });
