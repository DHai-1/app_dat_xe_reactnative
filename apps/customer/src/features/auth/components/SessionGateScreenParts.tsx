import { fontFamily, fontSize, spacing } from "@datxe/ui";
import type { ThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";

/**
 * Splash: nền coral đặc, logo PtitGo (bo góc mềm) canh giữa,
 * tagline in hoa giãn chữ và spinner mảnh ở gần đáy.
 */
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primaryContainer,
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
      borderRadius: (spacing.radarCore + spacing.spaceLg) * 0.225,
    },
    tagline: {
      fontFamily: fontFamily.inter,
      fontSize: fontSize.labelSm,
      lineHeight: 16,
      fontWeight: "600",
      letterSpacing: spacing.letterSpacingWidest,
      color: colors.onPrimaryContainer,
      marginTop: spacing.spaceLg,
      opacity: 0.9,
    },
    footer: {
      position: "absolute",
      bottom: spacing.radarOuter,
      alignItems: "center",
    },
  });
