import type { ThemeColors } from "@datxe/ui";
import { fontFamily } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const rideStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    page: { padding: 16, gap: 16 },
    title: {
      fontFamily: fontFamily.inter,
      fontSize: 24,
      fontWeight: "500",
      color: colors.onSurface,
    },
    text: {
      fontFamily: fontFamily.inter,
      fontSize: 16,
      lineHeight: 24,
      color: colors.onSurface,
    },
    label: {
      fontFamily: fontFamily.inter,
      fontSize: 13,
      fontWeight: "500",
      color: colors.onSurfaceVariant,
    },
    card: {
      padding: 16,
      borderRadius: 24,
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
    },
    listRow: { paddingVertical: 16, gap: 8 },
    button: {
      height: 48,
      paddingVertical: 0,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontFamily: fontFamily.inter,
      fontSize: 16,
      fontWeight: "500",
      color: colors.onPrimary,
    },
    link: {
      fontFamily: fontFamily.inter,
      fontSize: 15,
      color: colors.primary,
      fontWeight: "600",
    },
    error: { fontFamily: fontFamily.inter, fontSize: 14, color: colors.error },
    amount: { fontSize: 36, fontWeight: "800", fontVariant: ["tabular-nums"], color: colors.onSurface },
    metric: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"], color: colors.onSurface },
  });
