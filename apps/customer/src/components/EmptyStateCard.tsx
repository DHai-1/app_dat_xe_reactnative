import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

type EmptyStateCardProps = {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateCardProps) {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{i18nT(title)}</Text>
      <Text style={styles.description}>{i18nT(description)}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
      >
        <Text style={styles.actionText}>{i18nT(actionLabel)}</Text>
      </Pressable>
    </Card>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      gap: spacing.spaceSm,
      paddingHorizontal: spacing.spaceLg,
      paddingVertical: spacing.spaceXl,
      borderRadius: 24,

      backgroundColor: colors.surfaceContainerLowest,
    },
    iconBadge: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: colors.primaryFixedTint,
    },
    title: {
      ...typography.headlineSm,
      color: colors.onSurface,
      textAlign: "center",
    },
    description: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    action: {
      minHeight: spacing.buttonHeight,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.spaceXs,
      paddingHorizontal: spacing.spaceLg,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    actionText: {
      ...typography.labelLg,
      color: colors.onPrimary,
    },
    actionPressed: {
      opacity: 0.78,
    },
  });
