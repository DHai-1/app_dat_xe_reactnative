import { borderlessFrame } from "../theme/surfaces";
import { translate as i18nT } from "@datxe/shared";
import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Card as PaperCard } from "react-native-paper";
import { useThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

export type CardVariant = "surface" | "raised" | "muted";
export type CardProps = {
  children: ReactNode;
  /** Legacy raised cards now use a tonal surface. */
  variant?: CardVariant;
  /** Compact cards can use a smaller shape while the default remains 24dp. */
  radius?: 16 | 20 | 24;
  /** Retained for call-site compatibility; surfaces use semantic tones. */
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
  radius = 24,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  useLanguage();
  const colors = useThemeColors();
  // Paper separates its outer surface from the content layout. Keep legacy
  // row/column layouts inside the card while margins and sizing stay outside.
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    gap,
    rowGap,
    columnGap,
    flexDirection,
    alignItems,
    justifyContent,
    ...outer
  } = StyleSheet.flatten(style) ?? {};
  return (
    <PaperCard
      mode="contained"
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={i18nT(accessibilityLabel)}
      style={[
        {
          backgroundColor:
            variant === "muted"
              ? colors.surfaceContainerHigh
              : colors.cardSurface,
        },
        outer,
        styles.shape,
        { borderRadius: radius },
      ]}
    >
      <PaperCard.Content
        style={{
          gap,
          rowGap,
          columnGap,
          flexDirection,
          alignItems,
          justifyContent,
          padding: contentInset(padding) ?? 16,
          paddingHorizontal: contentInset(paddingHorizontal),
          paddingVertical: contentInset(paddingVertical),
          paddingTop: contentInset(paddingTop),
          paddingBottom: contentInset(paddingBottom),
          paddingLeft: contentInset(paddingLeft),
          paddingRight: contentInset(paddingRight),
        }}
      >
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
}
const styles = StyleSheet.create({
  shape: { ...borderlessFrame, borderRadius: 24, overflow: "hidden" },
});

function contentInset(value: ViewStyle["padding"]) {
  return typeof value === "number" ? Math.max(16, value) : value;
}
