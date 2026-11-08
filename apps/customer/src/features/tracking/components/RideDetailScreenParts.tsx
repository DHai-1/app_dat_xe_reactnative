import type { CustomerRideDetail } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
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
    FAILED_SYSTEM: "Không thể tìm tài xế do lỗi hệ thống",
    NO_DRIVER_FOUND: "Không tìm được tài xế",
    EXPIRED: "Hết hạn",
  };
  return labels[status];
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 28 },
    card: {
      padding: 16,
      gap: 9,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 24,
    },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    section: { ...typography.labelLg, color: colors.onSurface },
    body: { ...typography.bodyMd, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    historyRow: { flexDirection: "row", gap: 8 },
    historyDot: {
      width: 9,
      height: 9,
      borderRadius: 999,
      marginTop: 5,
      backgroundColor: colors.primary,
    },
    historyCopy: { flex: 1, gap: 3 },
    primary: {
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
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
      borderRadius: 999,
      backgroundColor: colors.primaryFixedTint,
    },
    secondaryText: { ...typography.labelLg, color: colors.primary },
  });
