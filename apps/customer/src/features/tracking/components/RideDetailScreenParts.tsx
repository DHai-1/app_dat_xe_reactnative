import type { CustomerRideDetail } from "@datxe/shared";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  borderRadius,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet, View } from "react-native";
export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];

export function Row({ label, value }: { label: string; value: string }) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();
  return (
    <View style={themed_styles.row}>
      <Text style={themed_styles.meta}>{i18nT(label)}</Text>
      <Text style={themed_styles.body}>{i18nT(value)}</Text>
    </View>
  );
}

export function statusLabel(status: CustomerRideDetail["status"]): string {
  const labels: Record<CustomerRideDetail["status"], string> = {
    PENDING: "Đang tiếp nhận",
    SEARCHING: "Đang tìm tài xế",
    DRIVER_ASSIGNED: "Đã có tài xế",
    DRIVER_ARRIVING: "Tài xế đang đến",
    DRIVER_ARRIVED: "Tài xế đã đến",
    VEHICLE_HANDOVER: "Đang bàn giao xe",
    IN_PROGRESS: "Đang thực hiện",
    ARRIVED_DESTINATION: "Đã đến điểm trả",
    VEHICLE_RETURNED: "Đang hoàn tất bàn giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_DRIVER_FOUND: "Không tìm được tài xế",
    EXPIRED: "Hết hạn",
  };
  return labels[status];
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 28 },
    card: {
      padding: 16,
      gap: 9,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.lg,
    },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    section: { ...typography.labelLg, color: colors.onSurface },
    label: { ...typography.labelSm, color: colors.primary },
    body: { ...typography.bodyMd, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    divider: { height: 1, backgroundColor: colors.outlineVariant },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    historyRow: { flexDirection: "row", gap: 10 },
    historyDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginTop: 5,
      backgroundColor: colors.primary,
    },
    historyCopy: { flex: 1, gap: 3 },
    images: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    image: {
      width: 92,
      height: 92,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerHigh,
    },
    primary: {
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    primaryText: { ...typography.labelLg, color: colors.onPrimary },
    error: { ...typography.bodyMd, color: colors.error },
    secondary: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryFixedTint,
    },
    secondaryText: { ...typography.labelLg, color: colors.primary },
  });
