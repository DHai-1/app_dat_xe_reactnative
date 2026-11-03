import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { MotionPressable } from "./MotionPressable";
import { Typography as Text } from "./Typography";

import { borderRadius, fontSize, spacing, typography } from "../theme/colors";

type IconName = keyof typeof MaterialIcons.glyphMap;

/**
 * Kiểu nút theo hệ Urban Pulse:
 * - primary: nền coral đặc, chữ trắng, nhấn đậm hơn khi pressed.
 * - secondary: nền xám nhạt, chữ than.
 * - ghost: trong suốt, chữ coral.
 * - tertiary: nền emerald (hành động phụ mang tính xác nhận).
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

export type ButtonIconPosition = "leading" | "trailing";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  /** Kiểu nút. Mặc định 'primary'. */
  variant?: ButtonVariant;
  /** Icon MaterialIcons hiển thị cạnh nhãn. */
  icon?: IconName;
  /** Vị trí icon so với nhãn. Mặc định 'trailing'. */
  iconPosition?: ButtonIconPosition;
  /** Kích thước icon (px). Mặc định fontSize.iconLg. */
  iconSize?: number;
  /** Màu icon và spinner. Mặc định theo variant. */
  contentColor?: string;
  loading?: boolean;
  /** Nhãn thay thế khi đang loading. */
  loadingLabel?: string;
  /** Thay spinner bằng icon MaterialIcons này (hiển thị phía trước) khi loading. */
  loadingIcon?: IconName;
  disabled?: boolean;
  /** Làm mờ nút khi bị disabled. Mặc định true (đổi sang nền xám). */
  dimWhenDisabled?: boolean;
  numberOfLines?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  iconPosition = "trailing",
  iconSize = fontSize.iconLg,
  contentColor: customContentColor,
  loading = false,
  loadingLabel,
  loadingIcon,
  disabled = false,
  dimWhenDisabled = true,
  numberOfLines,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useThemeColors();
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const isDisabled = disabled || loading;
  const neutral = isDisabled && dimWhenDisabled;
  const contentColor =
    customContentColor ??
    (neutral
      ? colors.disabledText
      : variant === "primary"
        ? colors.onPrimaryContainer
        : variant === "secondary"
          ? colors.onSurface
          : variant === "tertiary"
            ? colors.onTertiaryContainer
            : colors.primary);
  const showSpinner = loading && !loadingIcon;
  const leadingIcon = loading
    ? loadingIcon
    : iconPosition === "leading"
      ? icon
      : undefined;
  const trailingIcon = loading
    ? undefined
    : iconPosition === "trailing"
      ? icon
      : undefined;

  return (
    <MotionPressable
      accessibilityLabel={i18nT(accessibilityLabel ?? label)}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "tertiary" && styles.tertiary,
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && variant === "primary" && styles.primaryPressed,
        pressed &&
          !isDisabled &&
          variant === "secondary" &&
          styles.secondaryPressed,
        pressed && !isDisabled && variant === "ghost" && styles.ghostPressed,
        pressed && !isDisabled && variant === "tertiary" && styles.tertiaryPressed,
        neutral && styles.neutral,
        isDisabled && !neutral && styles.faded,
        style,
      ]}
    >
      {showSpinner ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : null}
      {leadingIcon ? (
        <MaterialIcons
          color={contentColor}
          name={leadingIcon}
          size={iconSize}
        />
      ) : null}
      <Text
        numberOfLines={numberOfLines}
        style={[styles.label, { color: contentColor }, textStyle]}
      >
        {i18nT(loading && loadingLabel ? loadingLabel : label)}
      </Text>
      {trailingIcon ? (
        <MaterialIcons
          color={contentColor}
          name={trailingIcon}
          size={iconSize}
        />
      ) : null}
    </MotionPressable>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      minHeight: spacing.buttonPillHeight,
      paddingVertical: spacing.px2,
      borderRadius: borderRadius.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
      paddingHorizontal: spacing.px5,
      borderWidth: 1,
      borderColor: colors.transparent,
    },
    primary: {
      backgroundColor: colors.primaryContainer,
    },
    primaryPressed: {
      backgroundColor: colors.primaryPressed,
    },
    secondary: {
      backgroundColor: colors.surfaceContainerLowest,
      borderColor: colors.outlineVariant,
    },
    secondaryPressed: {
      backgroundColor: colors.surfaceContainer,
    },
    tertiary: {
      backgroundColor: colors.tertiaryContainer,
    },
    tertiaryPressed: {
      backgroundColor: colors.tertiary,
    },
    ghost: {
      backgroundColor: colors.transparent,
    },
    ghostPressed: {
      backgroundColor: colors.primaryTint,
    },
    neutral: {
      backgroundColor: colors.disabled,
    },
    faded: {
      opacity: spacing.disabledOpacity,
    },
    label: {
      ...typography.labelLg,
      letterSpacing: 0.1,
    },
  });
