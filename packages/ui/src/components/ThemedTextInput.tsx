import { forwardRef, type ComponentRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { typography } from "../theme/colors";
import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "../theme/ThemeProvider";

export const ThemedTextInput = forwardRef<
  ComponentRef<typeof TextInput>,
  TextInputProps
>(function ThemedTextInput({ style, ...props }, ref) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.onSurfaceVariant}
      selectionColor={colors.primary}
      {...props}
      style={[styles.input, style]}
    />
  );
});
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    input: { ...typography.bodyLg, color: colors.onSurface },
  });
