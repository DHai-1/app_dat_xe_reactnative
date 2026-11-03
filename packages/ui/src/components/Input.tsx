import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { MotionPressable as Pressable } from "./MotionPressable";
import { ThemedTextInput as TextInput } from "./ThemedTextInput";
import { Typography as Text } from "./Typography";

import { borderRadius, fontSize, spacing, typography } from "../theme/colors";

type IconName = keyof typeof MaterialIcons.glyphMap;

export type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  /** Nội dung hiển thị bên phải dòng label, ví dụ liên kết "Quên mật khẩu?". */
  labelAccessory?: ReactNode;
  placeholder?: string;
  /** Icon MaterialIcons hiển thị bên trái ô nhập. */
  icon?: IconName;
  /** Bật chế độ mật khẩu kèm nút hiện/ẩn ở bên phải. */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  maxLength?: number;
  editable?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
  value,
  onChangeText,
  label,
  labelAccessory,
  placeholder,
  icon,
  secure = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  maxLength,
  editable,
  accessibilityLabel,
  style,
  inputStyle,
}: InputProps) {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const [focused, setFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(false);

  return (
    <View style={styles.field}>
      {label && labelAccessory ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{i18nT(label)}</Text>
          {labelAccessory}
        </View>
      ) : label ? (
        <Text style={styles.label}>{i18nT(label)}</Text>
      ) : null}

      <View style={[styles.row, focused && styles.rowFocused, style]}>
        {icon ? (
          <MaterialIcons
            color={colors.secondary}
            name={icon}
            size={fontSize.iconXl}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          accessibilityLabel={i18nT(accessibilityLabel ?? label)}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={i18nT(placeholder)}
          placeholderTextColor={colors.outline70}
          secureTextEntry={secure && !secureVisible}
          style={[styles.input, inputStyle]}
          value={value}
        />

        {secure ? (
          <Pressable
            accessibilityLabel={i18nT("Hiện hoặc ẩn mật khẩu")}
            onPress={() => setSecureVisible((visible) => !visible)}
            style={styles.visibilityButton}
          >
            <MaterialIcons
              color={colors.secondary}
              name={secureVisible ? "visibility-off" : "visibility"}
              size={fontSize.iconXl}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    field: {
      gap: spacing.gap1_5,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      ...typography.labelLg,
      fontSize: 13,
      color: colors.onSurface,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.px3_5,
      height: spacing.inputHeight,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    rowFocused: {
      borderColor: colors.primary,
    },
    icon: {
      marginRight: spacing.px2_5,
    },
    input: {
      ...typography.bodyLg,
      fontSize: 15,
      color: colors.onSurface,
      flex: 1,
      padding: 0,
    },
    visibilityButton: {
      padding: spacing.py1,
      borderRadius: borderRadius.lg,
    },
  });
