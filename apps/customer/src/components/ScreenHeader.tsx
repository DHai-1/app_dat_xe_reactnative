import { translate as i18nT } from "@datxe/shared";
import {
  borderRadius,
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type HeaderIconName = ComponentProps<typeof MaterialIcons>["name"];

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  backIcon?: HeaderIconName;
  leadingIcon?: HeaderIconName;
  leadingContent?: ReactNode;
  rightContent?: ReactNode;
  sideSlotWidth?: number;
  largeTitle?: boolean;
};

type HeaderIconButtonProps = {
  icon: HeaderIconName;
  accessibilityLabel: string;
  onPress: () => void;
  tone?: "neutral" | "primary";
  compact?: boolean;
};

type HeaderLabeledIconButtonProps = Omit<HeaderIconButtonProps, "compact"> & {
  label: string;
};

export const HEADER_SAFETY_ACTION_WIDTH = 80;
export const HEADER_ACTION_GROUP_WIDTH =
  spacing.iconButtonSm + HEADER_SAFETY_ACTION_WIDTH + spacing.spaceXs;

export function HeaderIconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = "neutral",
  compact = false,
}: HeaderIconButtonProps) {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={i18nT(accessibilityLabel)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        compact && styles.compactIconButton,
        tone === "primary" && styles.primaryIconButton,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={compact ? 20 : 22}
        color={tone === "primary" ? colors.primary : colors.onSurface}
      />
    </Pressable>
  );
}

export function HeaderLabeledIconButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
  tone = "primary",
}: HeaderLabeledIconButtonProps) {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={i18nT(accessibilityLabel)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.labeledIconButton,
        tone === "primary" && styles.primaryIconButton,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={16}
        color={tone === "primary" ? colors.primary : colors.onSurface}
      />
      <Text
        style={[
          styles.labeledIconText,
          tone === "primary" && styles.primaryLabeledIconText,
        ]}
      >
        {i18nT(label)}
      </Text>
    </Pressable>
  );
}

export function HeaderActionGroup({ children }: { children: ReactNode }) {
  useLanguage();

  const styles = useThemedStyles(makeStyles);
  return <View style={styles.actionGroup}>{children}</View>;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel = i18nT("Quay lại"),
  backIcon = "arrow-back-ios-new",
  leadingIcon,
  leadingContent,
  rightContent,
  sideSlotWidth = spacing.iconButtonMd,
  largeTitle = false,
}: ScreenHeaderProps) {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const left =
    leadingContent ??
    (onBack ? (
      <HeaderIconButton
        icon={backIcon}
        accessibilityLabel={i18nT(backAccessibilityLabel)}
        onPress={onBack}
      />
    ) : leadingIcon ? (
      <View style={styles.leadingIconBadge} accessible={false}>
        <MaterialIcons name={leadingIcon} size={22} color={colors.primary} />
      </View>
    ) : null);

  return (
    <View style={styles.container}>
      {leadingContent ? (
        <View style={styles.leadingContent}>{leadingContent}</View>
      ) : (
        <View
          style={[
            styles.sideSlot,
            leadingIcon && !onBack && styles.leadingIconSlot,
            { width: sideSlotWidth },
          ]}
        >
          {left}
        </View>
      )}
      {!leadingContent ? (
        <View style={styles.titleBlock}>
          {title ? (
            <Text
              numberOfLines={1}
              style={[styles.title, largeTitle && styles.largeTitle]}
            >
              {i18nT(title)}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {i18nT(subtitle)}
            </Text>
          ) : null}
        </View>
      ) : null}
      {rightContent ? (
        <View
          style={[styles.sideSlot, styles.rightSlot, { width: sideSlotWidth }]}
        >
          {rightContent}
        </View>
      ) : !leadingContent ? (
        <View style={[styles.sideSlot, { width: sideSlotWidth }]} />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      height: spacing.headerHeight,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.margin,
      gap: spacing.spaceSm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    sideSlot: {
      width: spacing.iconButtonMd,
      height: spacing.iconButtonMd,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    leadingContent: {
      flex: 1,
      minWidth: 0,
    },
    leadingIconSlot: {
      alignItems: "flex-start",
    },
    leadingIconBadge: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryFixedTint,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.headlineSm,
      color: colors.onSurface,
      textAlign: "center",
    },
    largeTitle: {
      ...typography.headlineMd,
    },
    subtitle: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      marginTop: 1,
    },
    iconButton: {
      width: spacing.iconButtonMd,
      height: spacing.iconButtonMd,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLow,
    },
    compactIconButton: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
    },
    labeledIconButton: {
      width: HEADER_SAFETY_ACTION_WIDTH,
      height: spacing.iconButtonSm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.gap1,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLow,
    },
    labeledIconText: {
      ...typography.labelSm,
      color: colors.onSurface,
    },
    primaryLabeledIconText: {
      color: colors.primary,
    },
    rightSlot: {
      alignItems: "flex-end",
    },
    actionGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
    },
    primaryIconButton: {
      backgroundColor: colors.primaryFixedTint,
    },
    pressed: {
      opacity: 0.72,
    },
  });
