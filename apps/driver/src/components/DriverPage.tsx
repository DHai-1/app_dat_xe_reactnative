import { driverApi } from "@/lib/driverApi";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Appbar } from "react-native-paper";
import {
  Button,
  Card,
  TonalNavigationBar,
  ScreenWrapper,
  Typography,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { usePathname, useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { rideStyles } from "./rideStyles";
import { useSessionStore } from "@/lib/store";
import { DriverChatButton } from "./DriverChatButton";

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
  footer?: ReactNode;
  headerContent?: ReactNode;
  headerAction?: ReactNode;
  intro?: ReactNode;
  appearance?: "ride";
  backFallback?: Href;
};
export function DriverPage({
  title,
  children,
  loading,
  error,
  retry,
  tabs = false,
  footer,
  headerContent,
  headerAction,
  intro,
  appearance,
  backFallback = "/(tabs)/home",
}: Props) {
  const styles = useThemedStyles(createStyles);
  const shared = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const rideBackground = appearance === "ride" ? styles.rideBackground : undefined;
  const router = useRouter();
  const pathname = usePathname();
  const activeRide = useSessionStore((state) => state.activeRide);
  const userId = useSessionStore((state) => state.user?.id);
  const { data: unread } = useQuery({
    queryKey: ["driver", "notifications", "count"],
    queryFn: driverApi.notificationCount,
    enabled: tabs && Boolean(userId),
    select: (result) => result?.unread_count ?? 0,
  });
  return (
    <ScreenWrapper style={rideBackground}>
      <Appbar.Header mode="small" statusBarHeight={0} style={[styles.header, rideBackground]}>
        {!tabs ? (
          <Appbar.BackAction
            style={styles.action}
            accessibilityLabel="Quay lại"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(backFallback)
            }
          />
        ) : null}
        <Appbar.Content title={title} titleStyle={styles.title} />
        {headerAction}
        {tabs && activeRide ? (
          <DriverChatButton ride={activeRide} compact />
        ) : null}
      </Appbar.Header>
      {headerContent}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={shared.page}
        keyboardShouldPersistTaps="handled"
      >
        {intro}
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
      {footer ? <View style={[styles.footer, appearance === "ride" && styles.rideFooter]}>{footer}</View> : null}
      {tabs ? (
        <TonalNavigationBar
          items={tabsList.map((tab) => ({ ...tab, id: tab.route, badge: tab.route === "notifications" ? unread : undefined }))}
          active={
            tabsList.find((tab) => pathname.endsWith("/" + tab.route))?.route ??
            "home"
          }
          onSelect={(id) => router.navigate(("/(tabs)/" + id) as never)}
        />
      ) : null}
    </ScreenWrapper>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    action: { width: 48, height: 48, borderRadius: 24 },
    footer: { padding: 16, gap: 8, backgroundColor: colors.cardSurface },
    rideBackground: { backgroundColor: colors.rideBackground },
    rideFooter: { backgroundColor: colors.rideSurface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.spaceMd,
      minHeight: spacing.headerHeight,
      gap: spacing.spaceSm,
      backgroundColor: colors.background,
    },
    title: { ...typography.headlineMd, color: colors.onSurface },
    errorCard: { gap: spacing.spaceMd, backgroundColor: colors.errorContainer },
  });
