import { borderlessFrame } from "../theme/surfaces";
import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ActivityIndicator, Text, TouchableRipple } from "react-native-paper";
import { fontSize } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

type IconName = keyof typeof MaterialIcons.glyphMap;

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
  useLanguage();
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const requestedHeight = StyleSheet.flatten(style)?.height;
  const fixedHeight =
    typeof requestedHeight === "number" ? requestedHeight : undefined;
  const contentColor =
    customContentColor ??
    (isDisabled && dimWhenDisabled
      ? colors.disabledText
      : variant === "primary"
        ? colors.onPrimary
        : variant === "tertiary"
          ? colors.onTertiaryContainer
          : variant === "secondary"
            ? colors.onSecondaryContainer
            : colors.primary);
  const buttonColor =
    isDisabled && dimWhenDisabled
      ? colors.disabled
      : variant === "primary"
        ? colors.primary
        : variant === "secondary"
          ? colors.secondaryContainer
          : variant === "tertiary"
            ? colors.tertiaryContainer
            : colors.transparent;
  const visibleIcon = loading ? loadingIcon : icon;
  return (
    <TouchableRipple
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={i18nT(accessibilityLabel ?? label)}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      rippleColor={
        variant === "primary" ? colors.onPrimary20 : colors.primaryTintStrong
      }
      style={[
        styles.button,
        { backgroundColor: buttonColor },
        isDisabled && !dimWhenDisabled && { opacity: 0.5 },
        style,
        styles.shape,
      ]}
    >
      <View
        style={[
          styles.content,
          fixedHeight !== undefined && {
            height: fixedHeight,
            minHeight: fixedHeight,
            paddingVertical: 0,
          },
          {
            flexDirection:
              iconPosition === "trailing" && !loading ? "row-reverse" : "row",
          },
        ]}
      >
        {loading && !loadingIcon ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : null}
        {visibleIcon ? (
          <MaterialIcons
            name={visibleIcon}
            size={iconSize}
            color={contentColor}
          />
        ) : null}
        <Text
          variant="labelLarge"
          numberOfLines={numberOfLines}
          style={[styles.label, { color: contentColor }, textStyle]}
        >
          {i18nT(loading && loadingLabel ? loadingLabel : label)}
        </Text>
      </View>
    </TouchableRipple>
  );
}
const styles = StyleSheet.create({
  button: { width: "100%" },
  // Insets belong to the inner content; caller padding must not inflate the frame.
  shape: {
    ...borderlessFrame,
    borderRadius: 999,
    overflow: "hidden",
    padding: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  content: {
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
    flexShrink: 1,
    textAlign: "center",
  },
});
