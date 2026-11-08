import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Typography as Text } from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import { fontSize, spacing, typography } from "../theme/colors";

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  brandLabel?: string;
  detail?: string;
};

export function AuthHero({ icon, title, subtitle, brandLabel, detail }: Props) {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons
          color={colors.primary}
          name={icon}
          size={fontSize.icon3xl}
        />
      </View>
      {brandLabel ? (
        <Text style={styles.brandLabel}>{i18nT(brandLabel)}</Text>
      ) : null}
      <Text style={styles.title}>{i18nT(title)}</Text>
      <Text style={styles.subtitle}>{i18nT(subtitle)}</Text>
      {detail ? <Text style={styles.detail}>{i18nT(detail)}</Text> : null}
    </View>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginBottom: spacing.spaceLg,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: colors.primary10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.spaceMd,
    },
    brandLabel: {
      ...typography.labelLg,
      color: colors.primary,
      marginBottom: spacing.spaceXs,
    },
    title: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
      textAlign: "center",
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      maxWidth: spacing.subtitleMaxWidth,
      marginTop: spacing.spaceXs,
    },
    detail: {
      ...typography.labelLg,
      color: colors.primary,
      textAlign: "center",
      marginTop: spacing.spaceSm,
    },
  });
