import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 14, paddingBottom: 28 },
    success: { alignItems: "center", gap: 8, padding: 16 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    meta: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    card: {
      padding: 16,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
      gap: 10,
    },
    section: { ...typography.labelLg, color: colors.onSurface },
    body: { ...typography.bodyMd, color: colors.onSurface },
    divider: { height: 1, backgroundColor: colors.outlineVariant },
    priceRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    price: { ...typography.labelLg, color: colors.primary },
    stars: { flexDirection: "row", justifyContent: "center", gap: 8 },
    input: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.lg,
      padding: 12,
      textAlignVertical: "top",
      ...typography.bodyMd,
      color: colors.onSurface,
    },
    counter: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      textAlign: "right",
    },
    primary: {
      minHeight: 52,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { ...typography.labelLg, color: colors.onPrimary },
    skip: { alignItems: "center", padding: 12 },
    skipText: { ...typography.labelLg, color: colors.primary },
    disabled: { opacity: 0.55 },
    error: { ...typography.bodyMd, color: colors.error },
  });
