import { translate as i18nT } from "@datxe/shared";
import { useState } from "react";
import { StyleSheet, View, type TextInputProps } from "react-native";
import {
  Typography as Text,
  ThemedTextInput as TextInput,
} from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import { spacing, typography } from "../theme/colors";

type Props = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function OtpCodeInput({
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  accessibilityLabel = i18nT("Mã xác thực 6 chữ số"),
}: Props) {
  const colors = useThemeColors();

  useLanguage();

  const styles = useThemedStyles(base_styles);

  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, 5);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.codeBoxes}>
        {Array.from({ length: 6 }, (_, index) => {
          const isActive = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.codeBox,
                Boolean(value[index]) && styles.codeBoxFilled,
                isActive && styles.codeBoxActive,
                disabled && styles.codeBoxDisabled,
              ]}
            >
              {value[index] ? (
                <Text style={styles.codeDigit}>{i18nT(value[index])}</Text>
              ) : isActive ? (
                <View style={styles.caret} />
              ) : null}
            </View>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={i18nT(accessibilityLabel)}
        autoComplete="sms-otp"
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        caretHidden
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={6}
        onBlur={() => setFocused(false)}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
        onFocus={() => setFocused(true)}
        selectionColor={colors.transparent}
        style={styles.input}
        textContentType={"oneTimeCode" as TextInputProps["textContentType"]}
        value={value}
      />
    </View>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      maxWidth: spacing.otpMaxWidth,
      alignSelf: "center",
    },
    codeBoxes: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.gap1_5,
    },
    codeBox: {
      width: 48,
      height: 56,
      flexGrow: 0,
      flexShrink: 1,
      minWidth: 32,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceContainerLowest,
    },
    codeBoxFilled: {
      backgroundColor: colors.surfaceContainerLowest,
      borderColor: colors.outlineVariant,
    },
    codeBoxActive: {
      backgroundColor: colors.surfaceContainerLowest,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    codeBoxDisabled: { opacity: spacing.disabledOpacity },
    codeDigit: { ...typography.headlineMd, color: colors.onSurface },
    caret: {
      width: spacing.cursorWidth,
      height: spacing.cursorHeight,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    input: {
      ...StyleSheet.absoluteFill,
      opacity: 0.02,
      color: colors.onSurface,
    },
  });
