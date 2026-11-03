import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { borderRadius, shadowStyle, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export type Filter = "all" | "completed" | "cancelled";

export const labelForStatus: Record<string, string> = {
  PENDING: "Đang tiếp nhận",
  SEARCHING: "Đang tìm tài xế",
  DRIVER_ASSIGNED: "Đã có tài xế",
  DRIVER_ARRIVING: "Tài xế đang đến",
  DRIVER_ARRIVED: "Tài xế đã đến",
  VEHICLE_HANDOVER: "Bàn giao xe",
  IN_PROGRESS: "Đang thực hiện",
  ARRIVED_DESTINATION: "Đã đến nơi",
  VEHICLE_RETURNED: "Đã trả xe",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_DRIVER_FOUND: "Không tìm được tài xế",
  EXPIRED: "Hết hạn",
};

export const money = (value: number) =>
  i18nT("{0} đ", { "0": new Intl.NumberFormat(getLocale()).format(value) });

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    scroll: { flex: 1 },
    content: { padding: spacing.margin, gap: spacing.px5, paddingBottom: spacing.spaceXl },
    summary: {
      alignItems: "center",
      padding: 16,
      borderRadius: borderRadius.xxl,
      backgroundColor: colors.primaryTint,
      gap: 2,
    },
    summaryCount: { ...typography.headlineLg, color: colors.primary },
    summaryText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    filters: { flexDirection: "row", gap: 8 },
    filter: {
      flex: 1,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLowest,
    },
    filterActive: {
      backgroundColor: colors.primaryTint,
      borderColor: colors.primary,
    },
    filterText: { ...typography.labelMd, color: colors.onSurfaceVariant },
    filterTextActive: { color: colors.primary },
    ride: {
      padding: 16,
      gap: 8,
      borderRadius: borderRadius.xxl,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    rideHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    rideTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    rideTitle: { ...typography.labelLg, color: colors.onSurface },
    status: { ...typography.labelSm, color: colors.primary },
    statusCancelled: { color: colors.error },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    address: { ...typography.bodyMd, color: colors.onSurface },
    pin: { color: colors.primary },
    rideFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      paddingTop: 6,
    },
    fare: { ...typography.labelLg, color: colors.onSurface },
    more: { minHeight: 48, justifyContent: "center", alignItems: "center" },
    moreText: { ...typography.labelLg, color: colors.primary },
    error: { ...typography.bodyMd, color: colors.error },
  });
