import { createContext, useContext } from "react";
import { StyleSheet, type TextProps } from "react-native";
import { Text } from "react-native-paper";
import { typography } from "../theme/colors";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";

const NestedText = createContext(false);
export function Typography({ style, children, ...props }: TextProps) {
  const nested = useContext(NestedText);
  const styles = useThemedStyles(createStyles);
  return (
    <NestedText.Provider value>
      <Text {...props} style={[!nested && styles.body, style]}>
        {children}
      </Text>
    </NestedText.Provider>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { ...typography.bodyMd, color: colors.onSurface },
  });
