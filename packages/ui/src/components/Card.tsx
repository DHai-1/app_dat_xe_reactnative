import { translate as i18nT } from "@datxe/shared";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { MotionPressable } from "./MotionPressable";

import { borderRadius, shadowStyle, spacing } from "../theme/colors";

export type CardVariant = "surface" | "raised" | "muted";

export type CardProps = {
  children: ReactNode;
  /**
   * 'surface' = nền trắng + shadow nhẹ (mặc định).
   * 'raised' = shadow đậm hơn cho card nổi bật.
   * 'muted' = nền xám, không shadow.
   */
  variant?: CardVariant;
  /** Truyền màu gradient để đổi nền card thành LinearGradient. */
  gradient?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  variant = "surface",
  gradient,
  gradientStart,
  gradientEnd,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const containerStyle = [
    styles.base,
    variant === "surface" && styles.surface,
    variant === "raised" && styles.raised,
    variant === "muted" && styles.muted,
    style,
  ];

  const content = gradient ? (
    <LinearGradient
      colors={gradient}
      end={gradientEnd}
      start={gradientStart}
      style={containerStyle}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={containerStyle}>{children}</View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <MotionPressable
      accessibilityLabel={i18nT(accessibilityLabel)}
      accessibilityRole="button"
      onPress={onPress}
    >
      {content}
    </MotionPressable>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      borderRadius: borderRadius.xxl,
      padding: spacing.spaceLg,
      borderWidth: 1,
      borderColor: colors.transparent,
    },
    surface: {
      backgroundColor: colors.cardSurface,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    raised: {
      backgroundColor: colors.cardSurface,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    muted: {
      backgroundColor: colors.surfaceContainer,
    },
  });
