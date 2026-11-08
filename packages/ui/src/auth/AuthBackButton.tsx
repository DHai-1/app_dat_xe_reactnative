import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { MotionPressable as Pressable } from "../components";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import { fontSize, spacing } from "../theme/colors";

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AuthBackButton({
  onPress,
  accessibilityLabel = i18nT("Quay lại"),
}: Props) {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  return (
    <Pressable
      accessibilityLabel={i18nT(accessibilityLabel)}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <MaterialIcons
        color={colors.onSurface}
        name="arrow-back"
        size={fontSize.iconXl}
      />
    </Pressable>
  );
}

const base_styles = () =>
  StyleSheet.create({
    button: {
      width: Math.max(48, spacing.iconButtonMd),
      height: Math.max(48, spacing.iconButtonMd),
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
  });
