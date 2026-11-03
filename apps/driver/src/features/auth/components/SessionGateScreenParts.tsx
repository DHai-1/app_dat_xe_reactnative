import type { ThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
  });
