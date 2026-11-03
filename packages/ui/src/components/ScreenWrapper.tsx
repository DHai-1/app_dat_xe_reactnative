import { StyleSheet } from "react-native";
import {
  SafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";

export function ScreenWrapper({ style, ...props }: SafeAreaViewProps) {
  const styles = useThemedStyles(createStyles);
  return <SafeAreaView {...props} style={[styles.screen, style]} />;
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
  });
