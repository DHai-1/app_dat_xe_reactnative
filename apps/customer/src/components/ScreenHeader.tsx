import { translate as i18nT } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { Appbar } from "react-native-paper";
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
  sideSlotWidth = 48,
  largeTitle = false,
}: ScreenHeaderProps) {
  useLanguage();

  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.headerHost}>
      <Appbar.Header statusBarHeight={0} mode="small" style={styles.container}>
        {onBack ? (
          <Appbar.Action
            isLeading
            style={styles.leadingAction}
            icon={(props) => <MaterialIcons {...props} name={backIcon} />}
            accessibilityLabel={i18nT(backAccessibilityLabel)}
            onPress={onBack}
          />
        ) : leadingIcon ? (
          <Appbar.Action
            isLeading
            style={styles.leadingAction}
            icon={(props) => <MaterialIcons {...props} name={leadingIcon} />}
            accessible={false}
          />
        ) : null}
        {leadingContent ? (
          <View style={styles.leadingContent}>{leadingContent}</View>
        ) : (
          <Appbar.Content
            style={styles.titleBlock}
            title={
              <View style={styles.titleCopy}>
                {title ? (
                  <Text
                    accessibilityRole="header"
                    numberOfLines={2}
                    style={[styles.title, largeTitle && styles.largeTitle]}
                  >
                    {i18nT(title)}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text numberOfLines={2} style={styles.subtitle}>
                    {i18nT(subtitle)}
                  </Text>
                ) : null}
              </View>
            }
          />
        )}
        {rightContent ? (
          <View style={[styles.rightSlot, { width: sideSlotWidth }]}>
            {rightContent}
          </View>
        ) : null}
      </Appbar.Header>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    headerHost: { flexShrink: 0, backgroundColor: colors.background },
    container: {
      minHeight: 64,
      height: "auto",
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: colors.background,
    },
    leadingAction: { width: 48, height: 48, borderRadius: 999 },
    leadingContent: {
      flex: 1,
      minWidth: 0,
    },
    titleBlock: { flex: 1, minWidth: 0, marginLeft: 8, marginRight: 8 },
    titleCopy: { minWidth: 0, gap: 4 },
    title: {
      ...typography.headlineMd,
      color: colors.onSurface,
      fontWeight: "600",
      textAlign: "left",
    },
    largeTitle: { fontSize: 24, lineHeight: 32 },
    subtitle: { ...typography.labelSm, fontSize: 13, lineHeight: 18, color: colors.onSurfaceMuted },
    iconButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLow,
    },
    compactIconButton: {
      width: 48,
      height: 48,
    },
    labeledIconButton: {
      width: HEADER_SAFETY_ACTION_WIDTH,
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.gap1,
      borderRadius: 999,
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
      flexShrink: 0,
      alignItems: "flex-end",
      justifyContent: "center",
      marginRight: 8,
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
