import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const statusText: Record<string, string> = {
  PENDING: "Yêu cầu đang được tiếp nhận",
  SEARCHING: "Đang tìm tài xế phù hợp",
  DRIVER_ASSIGNED: "Đã có tài xế nhận chuyến",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
  VEHICLE_HANDOVER: "Đang chờ xác nhận bàn giao xe",
  IN_PROGRESS: "Chuyến đi đang diễn ra",
  ARRIVED_DESTINATION: "Xe đã đến điểm trả",
  VEHICLE_RETURNED: "Đang chờ xác nhận hoàn trả xe",
  COMPLETED: "Chuyến đi đã hoàn thành",
  NO_DRIVER_FOUND: "Chưa tìm được tài xế",
  EXPIRED: "Yêu cầu chuyến đi đã hết hạn",
  CANCELLED: "Chuyến đi đã bị hủy",
};

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.margin,
      gap: 16,
    },
    icon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primaryFixedTint,
      alignItems: "center",
      justifyContent: "center",
    },
    status: {
      ...typography.headlineSm,
      color: colors.onSurface,
      textAlign: "center",
    },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    route: {
      width: "100%",
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
      padding: 16,
      gap: 8,
    },
    label: { ...typography.labelSm, color: colors.primary },
    address: { ...typography.bodyMd, color: colors.onSurface },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 4,
    },
    error: { ...typography.bodyMd, color: colors.error, textAlign: "center" },
    secondary: { padding: 12 },
    secondaryText: { ...typography.labelLg, color: colors.primary },
    cancel: {
      minHeight: 50,
      width: "100%",
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: { ...typography.labelLg, color: colors.error },
    disabled: { opacity: 0.45 },
  });
