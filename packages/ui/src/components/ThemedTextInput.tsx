import { forwardRef, type ComponentRef } from "react";
import { StyleSheet, TextInput } from "react-native";
import { NativeDraftTextInput, type DraftTextInputProps } from "./NativeDraftTextInput";
import { typography } from "../theme/colors";
import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "../theme/ThemeProvider";

export const ThemedTextInput = forwardRef<
  ComponentRef<typeof TextInput>,
  DraftTextInputProps
>(function ThemedTextInput({ style, ...props }, ref) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <NativeDraftTextInput
      ref={ref}
      placeholderTextColor={colors.onSurfaceVariant}
      selectionColor={colors.primary}
      autoCorrect={false}
      spellCheck={false}
      {...props}
      style={[styles.input, style]}
    />
  );
});
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    input: { ...typography.bodyLg, color: colors.onSurface },
  });
