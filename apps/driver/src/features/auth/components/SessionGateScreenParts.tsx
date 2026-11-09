import type { ThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    card: { width: "100%", maxWidth: 480, gap: 16 },
    logo: { width: 112, height: 112, alignSelf: "center" },
    status: { textAlign: "center" },
  });
