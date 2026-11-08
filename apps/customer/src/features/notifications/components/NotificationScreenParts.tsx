import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export type NotificationFilter = "all" | "trip" | "promo" | "vehicle";

export const category = (type: string): NotificationFilter => {
  const key = type.toLowerCase();
  if (
    key.includes("voucher") ||
    key.includes("promo") ||
    key.includes("promotion")
  )
    return "promo";
  if (key.includes("vehicle") || key.includes("handover")) return "vehicle";
  return "trip";
};

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: spacing.margin, gap: 16, paddingBottom: 32 },
    summary: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    list: { gap: 16 },
    dayGroup: { gap: 8 },
    summaryCopy: { flex: 1, minWidth: 160 },
    markAllButton: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    heading: { ...typography.labelLg, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    markAll: { ...typography.labelMd, color: colors.primary },
    dim: { color: colors.onSurfaceVariant },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    filter: {
      flexGrow: 1,
      flexBasis: "22%",
      minWidth: 64,
      minHeight: 48,
      paddingHorizontal: 8,
      paddingVertical: 8,
      justifyContent: "center",
      alignItems: "center",

      borderRadius: 999,

      backgroundColor: colors.surfaceContainerHigh,
    },
    filterActive: {
      backgroundColor: colors.primaryContainer,
    },
    filterText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    filterTextActive: { color: colors.onPrimaryContainer },
    item: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,

      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    icon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerHigh,
    },
    iconUnread: { backgroundColor: colors.primaryFixedTint },
    copy: { flex: 1, minWidth: 0, gap: 8 },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    itemTitle: {
      ...typography.titleMd,
      color: colors.onSurface,
      flex: 1,
      minWidth: 0,
    },
    body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    time: { ...typography.labelMd, color: colors.onSurfaceMuted },
    dot: {
      width: 8,
      height: 8,
      flexShrink: 0,
      marginTop: 7,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    error: { ...typography.bodyMd, color: colors.error },
  });
