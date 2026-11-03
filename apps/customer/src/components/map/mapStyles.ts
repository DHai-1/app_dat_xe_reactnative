import type { ThemeColors } from "@datxe/ui";
import { fontFamily } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const bookingStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    empty: { padding: 24, alignItems: "center", gap: 12 },
    muted: {
      fontFamily: fontFamily.inter,
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });
