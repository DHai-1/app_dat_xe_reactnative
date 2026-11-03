import {
  Button,
  Card,
  MotionPressable,
  ScreenWrapper,
  Typography,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { rideStyles } from "./rideStyles";

const tabsList = [
  { route: "home", label: "Trang chủ", icon: "home" },
  { route: "history", label: "Lịch sử", icon: "receipt-long" },
  { route: "notifications", label: "Thông báo", icon: "notifications" },
  { route: "profile", label: "Hồ sơ", icon: "person" },
] as const;

type Props = {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  retry?: () => unknown;
  tabs?: boolean;
};
export function DriverPage({
  title,
  children,
  loading,
  error,
  retry,
  tabs = false,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const shared = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        {!tabs ? (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/home")
            }
            style={styles.back}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.onSurface}
            />
          </MotionPressable>
        ) : null}
        <Typography accessibilityRole="header" style={styles.title}>
          {title}
        </Typography>
      </View>
      <ScrollView
        contentContainerStyle={shared.page}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <Card style={styles.errorCard}>
            <Typography accessibilityRole="alert" style={shared.error}>
              {error}
            </Typography>
            {retry ? (
              <Button label="Thử lại" onPress={() => void retry()} />
            ) : null}
          </Card>
        ) : null}
        {children}
      </ScrollView>
      {tabs ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {tabsList.map((tab) => {
            const selected = pathname.endsWith("/" + tab.route);
            return (
              <MotionPressable
                key={tab.route}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                style={styles.tab}
                onPress={() => {
                  if (!selected)
                    router.navigate(("/(tabs)/" + tab.route) as never);
                }}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={24}
                  color={selected ? colors.primary : colors.onSurfaceVariant}
                />
                <Typography
                  numberOfLines={1}
                  style={[styles.tabLabel, selected && styles.selected]}
                >
                  {tab.label}
                </Typography>
              </MotionPressable>
            );
          })}
        </View>
      ) : null}
    </ScreenWrapper>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.spaceMd,
      minHeight: spacing.headerHeight,
      gap: spacing.spaceSm,
      backgroundColor: colors.surfaceContainerLowest,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    back: {
      width: spacing.iconButtonMd,
      height: spacing.iconButtonMd,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.headlineMd, color: colors.onSurface, flex: 1 },
    errorCard: { gap: spacing.spaceMd, backgroundColor: colors.errorContainer },
    tabs: {
      flexDirection: "row",
      minHeight: spacing.tabBarHeight,
      paddingHorizontal: spacing.spaceXs,
      backgroundColor: colors.surfaceContainerLowest,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceXs,
    },
    tabLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
    selected: { color: colors.primary },
  });
