import { createContext, useContext } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { typography } from "../theme/colors";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";

const NestedText = createContext(false);
export function Typography({ style, ...props }: TextProps) {
  const nested = useContext(NestedText);
  const styles = useThemedStyles(createStyles);
  return (
    <NestedText.Provider value>
      <Text {...props} style={[!nested && styles.body, style]} />
    </NestedText.Provider>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { ...typography.bodyMd, color: colors.onSurface },
  });
