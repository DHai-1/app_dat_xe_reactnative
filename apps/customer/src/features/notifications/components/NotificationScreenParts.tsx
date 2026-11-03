import { getLocale } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
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

export const readable = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

export const titleFor = (type: string) =>
  type
    .replaceAll("_", " ")
    .toLocaleLowerCase(getLocale())
    .replace(/^./, (char) => char.toLocaleUpperCase(getLocale())) ||
  "Thông báo";

export const bodyFor = (rawPayload: unknown) => {
  const payload =
    rawPayload && typeof rawPayload === "object"
      ? (rawPayload as Record<string, unknown>)
      : {};
  for (const key of ["message", "body", "description", "content", "note"]) {
    const value = readable(payload[key]);
    if (value) return value;
  }
  const parts = Object.entries(payload)
    .filter(
      ([, value]) => typeof value === "string" || typeof value === "number",
    )
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return parts.join(" · ") || "Thông báo được ghi nhận từ hệ thống.";
};

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    scroll: { flex: 1 },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 30 },
    summary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
    },
    heading: { ...typography.labelLg, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    markAll: { ...typography.labelMd, color: colors.primary },
    dim: { color: colors.onSurfaceVariant },
    filters: { flexDirection: "row", gap: 7 },
    filter: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.full,
    },
    filterActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { ...typography.labelSm, color: colors.onSurfaceVariant },
    filterTextActive: { color: colors.onPrimary },
    item: {
      flexDirection: "row",
      gap: 12,
      padding: 14,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
    },
    itemUnread: { borderWidth: 1, borderColor: colors.primaryFixed },
    icon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      backgroundColor: colors.surfaceContainerHigh,
    },
    iconUnread: { backgroundColor: colors.primaryFixedTint },
    copy: { flex: 1, gap: 5 },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemTitle: { ...typography.labelMd, color: colors.onSurface },
    itemTitleUnread: { color: colors.primary },
    body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    time: { ...typography.labelSm, color: colors.onSurfaceVariant },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    error: { ...typography.bodyMd, color: colors.error },
  });
