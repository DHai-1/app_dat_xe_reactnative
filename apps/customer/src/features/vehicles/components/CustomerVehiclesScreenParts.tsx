import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 32 },
    vehicle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 0,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    image: { width: 60, height: 60, borderRadius: 24 },
    imagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryFixedTint,
    },
    details: { flex: 1, minWidth: 48, minHeight: 48, justifyContent: "center", gap: 3 },
    name: { ...typography.labelLg, color: colors.onSurface },
    plate: { ...typography.labelMd, color: colors.primary },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    delete: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    add: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    addText: { ...typography.labelLg, color: colors.onPrimary },
    empty: { alignItems: "center", gap: 8, padding: 24 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    error: { ...typography.bodyMd, color: colors.error },
  });
