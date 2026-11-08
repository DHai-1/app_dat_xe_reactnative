import { HistoryRideListItem } from "../components/HistoryRideListItem";
import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { CustomerTabBar } from "@/components/CustomerTabBar";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  HEADER_SAFETY_ACTION_WIDTH,
  HeaderActionGroup,
  HeaderLabeledIconButton,
  ScreenHeader,
} from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { RefreshControl, ScrollView, View } from "react-native";

import { styles as base_styles } from "../components/TripHistoryScreenParts";
import { useTripHistory } from "../hooks/useTripHistory";
export default function TripHistoryScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    filter,
    setFilter,
    rides,
    total,
    page,
    hasNext,
    loading,
    loadingMore,
    refreshing,
    refresh,
    error,
    unreadCount,
    load,
  } = useTripHistory();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Lịch sử")}
        largeTitle
        sideSlotWidth={HEADER_SAFETY_ACTION_WIDTH}
        rightContent={
          <HeaderActionGroup>
            <HeaderLabeledIconButton
              icon="shield"
              label={i18nT("An toàn")}
              accessibilityLabel={i18nT("An toàn chuyến đi")}
              onPress={() =>
                router.push({
                  pathname: "/support",
                  params: { topic: "safety" },
                })
              }
            />
          </HeaderActionGroup>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            progressBackgroundColor={colors.cardSurface}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        style={styles.scroll}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryCount}>{i18nT(total)}</Text>
          <Text style={styles.summaryText}>
            {i18nT("chuyến trong tài khoản")}
          </Text>
        </View>
        <View style={styles.filters}>
          {(
            [
              ["all", i18nT("Tất cả")],
              ["completed", i18nT("Hoàn thành")],
              ["cancelled", i18nT("Đã hủy")],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === key }}
              onPress={() => setFilter(key)}
              style={[styles.filter, filter === key && styles.filterActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === key && styles.filterTextActive,
                ]}
              >
                {i18nT(label)}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
        {!loading && !error && rides.length === 0 ? (
          <EmptyStateCard
            icon="history"
            title={i18nT(
              filter === "all"
                ? "Chưa có chuyến đi nào"
                : "Chưa có chuyến phù hợp",
            )}
            description={i18nT(
              filter === "all"
                ? "Các chuyến đi của bạn sẽ xuất hiện ở đây."
                : "Thử xem tất cả chuyến đi để tìm chuyến bạn cần.",
            )}
            actionLabel={
              filter === "all"
                ? i18nT("Đặt chuyến đầu tiên")
                : i18nT("Xem tất cả chuyến")
            }
            onAction={() =>
              filter === "all"
                ? router.push("/ride/route-selection")
                : setFilter("all")
            }
          />
        ) : null}
        {rides.length ? (
          <View style={styles.list}>
            {rides.map((ride) => (
              <HistoryRideListItem
                key={ride.id}
                ride={ride}
                onPress={() =>
                  router.push({
                    pathname: "/ride/[id]",
                    params: {
                      id: String(ride.id),
                      rideId: String(ride.id),
                      returnTo: "history",
                    },
                  })
                }
              />
            ))}
          </View>
        ) : null}
        {hasNext ? (
          <Pressable
            disabled={loadingMore}
            onPress={() => void load(page + 1, true)}
            style={styles.more}
          >
            {loadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.moreText}>{i18nT("Tải thêm chuyến")}</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
      <CustomerTabBar active="history" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
