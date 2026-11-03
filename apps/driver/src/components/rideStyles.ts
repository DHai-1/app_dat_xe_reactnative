import type { ThemeColors } from "@datxe/ui";
import { fontFamily } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const rideStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    page: { padding: 20, gap: 16 },
    title: {
      fontFamily: fontFamily.inter,
      fontSize: 24,
      fontWeight: "700",
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
      fontSize: 12,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
    },
    card: {
      padding: 18,
      borderRadius: 18,
      gap: 10,
      backgroundColor: colors.surfaceContainerLowest,
    },
    button: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    buttonText: {
      fontFamily: fontFamily.inter,
      fontSize: 16,
      fontWeight: "700",
      color: colors.onPrimary,
    },
    link: {
      fontFamily: fontFamily.inter,
      fontSize: 15,
      color: colors.primary,
      fontWeight: "600",
    },
    error: { fontFamily: fontFamily.inter, fontSize: 14, color: colors.error },
  });
