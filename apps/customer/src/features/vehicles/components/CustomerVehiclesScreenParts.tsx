import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 30 },
    vehicle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 13,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
    },
    image: { width: 60, height: 60, borderRadius: borderRadius.lg },
    imagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryFixedTint,
    },
    details: { flex: 1, gap: 3 },
    name: { ...typography.labelLg, color: colors.onSurface },
    plate: { ...typography.labelMd, color: colors.primary },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    delete: {
      width: 38,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    add: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    addText: { ...typography.labelLg, color: colors.onPrimary },
    empty: { alignItems: "center", gap: 8, padding: 24 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    error: { ...typography.bodyMd, color: colors.error },
  });
