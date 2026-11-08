import { fontFamily, spacing } from "@datxe/ui";
import type { ThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    glow: {
      position: "absolute",
      width: spacing.radarOuter,
      height: spacing.radarOuter,
      borderRadius: spacing.radarOuter / 2,
      backgroundColor: colors.onPrimary20,
      opacity: 0.35,
    },
    logo: {
      width: spacing.radarCore + spacing.spaceLg,
      height: spacing.radarCore + spacing.spaceLg,
      borderRadius: 24,
    },
    tagline: {
      fontFamily: fontFamily.inter,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "600",
      textAlign: "center",
      color: colors.onSurfaceVariant,
    },
    footer: {
      alignItems: "center",
      gap: 10,
      marginTop: 24,
    },
  });
