import { CustomerTabBar } from "@/components/CustomerTabBar";
import { HomeMap } from "@/components/map/HomeMap";
import { translate as i18nT } from "@datxe/shared";
import {
  borderRadius,
  Card,
  fontSize,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  spacing,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  styles as base_styles,
  formatCurrency,
  getGreeting,
  getRideStatusLabel,
} from "../components/HomeScreenParts";
import { useHome } from "../hooks/useHome";
export default function HomeScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const insets = useSafeAreaInsets();

  const [recenterToken, setRecenterToken] = useState(0);

  // Chiều cao thật của header: bản đồ trượt lên đúng bán kính bo góc của nó,
  // còn ô tìm kiếm bám vào đáy header.
  const [heroHeight, setHeroHeight] = useState(0);
  const headerRadius = borderRadius.xl;

  const {
    router,
    profile,
    activeRide,
    unreadCount,
    loading,
    loadError,
    currentHour,
    currentLocation,
    currentCoordinates,
    nearbyDrivers,
    locationLoading,
    refreshLocation,
    greetingName,
    openBooking,
  } = useHome();

  // Nút mục tiêu: lấy lại GPS hiện tại rồi đưa camera về đúng vị trí người dùng.
  const recenter = () => {
    void refreshLocation(true);
    setRecenterToken((value) => value + 1);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.body}>
        {/* Bản đồ nằm dưới header (vẽ trước trong cây view) và trượt lên đúng bằng
            bán kính bo góc header, nhờ vậy hai góc bo không còn hở nền. */}
        <View
          pointerEvents="box-none"
          style={[
            styles.mapLayer,
            { top: heroHeight > 0 ? Math.max(heroHeight - headerRadius, 0) : 0 },
            heroHeight > 0 ? null : styles.hidden,
          ]}
        >
          <HomeMap
            coordinate={currentCoordinates}
            drivers={nearbyDrivers}
            fullscreen
            recenterToken={recenterToken}
          />
        </View>

        <View
          onLayout={(event) => setHeroHeight(event.nativeEvent.layout.height)}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroRow}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={styles.heroGreeting}
            >
              {i18nT(getGreeting(currentHour))}, {greetingName}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("An toàn chuyến đi")}
              onPress={() =>
                router.push({
                  pathname: "/support",
                  params: { topic: "safety" },
                })
              }
              style={styles.heroSafety}
            >
              <MaterialIcons
                color={colors.onPrimaryContainer}
                name="shield"
                size={fontSize.iconMd}
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18nT("Cập nhật vị trí hiện tại")}
            disabled={locationLoading}
            onPress={() => void refreshLocation(true)}
            style={styles.heroLocation}
          >
            <MaterialIcons
              color={colors.onPrimaryContainer}
              name="place"
              size={fontSize.iconMd}
            />
            <Text numberOfLines={1} style={styles.heroLocationText}>
              {i18nT(
                locationLoading ? "Đang xác định vị trí…" : currentLocation,
              )}
            </Text>
            {locationLoading ? (
              <ActivityIndicator
                color={colors.onPrimaryContainer}
                size="small"
              />
            ) : (
              <MaterialIcons
                color={colors.onPrimaryContainer}
                name="expand-more"
                size={fontSize.iconLg}
              />
            )}
          </Pressable>
        </View>

        {/* Lớp nổi: ô tìm kiếm + nút mục tiêu, vẽ sau header nên nằm trên cả hai. */}
        <View pointerEvents="box-none" style={styles.overlay}>
          <View
            pointerEvents="box-none"
            style={[
              styles.searchLayer,
              {
                top:
                  heroHeight > 0
                    ? Math.max(heroHeight - spacing.spaceXl, 0)
                    : 0,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT(
                activeRide
                  ? "Theo dõi chuyến đang hoạt động"
                  : "Nhập điểm đến để bắt đầu đặt xe",
              )}
              onPress={() => openBooking()}
              style={styles.searchCard}
            >
              <View style={styles.searchIconTile}>
                <MaterialIcons
                  color={colors.primary}
                  name="search"
                  size={fontSize.icon2xl}
                />
              </View>
              <View style={styles.searchCopy}>
                <Text style={styles.searchTitle}>
                  {i18nT(
                    activeRide
                      ? "Theo dõi chuyến đang hoạt động"
                      : "Bạn muốn đi đâu?",
                  )}
                </Text>
                <Text numberOfLines={1} style={styles.searchSubtitle}>
                  {activeRide
                    ? i18nT(getRideStatusLabel(activeRide.status))
                    : i18nT("Nhập điểm đến, trường học, cơ quan…")}
                </Text>
              </View>
              <MaterialIcons
                color={colors.onSurfaceVariant}
                name="mic"
                size={fontSize.iconLg}
              />
            </Pressable>

            {loadError ? (
              <Pressable
                accessibilityRole="alert"
                onPress={() => void refreshLocation(true)}
                style={styles.alertPill}
              >
                <Text numberOfLines={2} style={styles.alertText}>
                  {i18nT(loadError)}
                </Text>
              </Pressable>
            ) : loading && !profile ? (
              <View style={styles.alertPill}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null}
          </View>

          <View pointerEvents="box-none" style={styles.bottomLayer}>
            {activeRide ? (
              <Card
                accessibilityLabel={i18nT(
                  i18nT("Mở chi tiết chuyến {0}", { "0": activeRide.id }),
                )}
                onPress={() =>
                  router.push({
                    pathname: "/ride/tracking",
                    params: { rideId: String(activeRide.id) },
                  })
                }
                style={styles.tripCard}
                variant="surface"
              >
                <View style={styles.tripAccent} />
                <View style={styles.tripStatusRow}>
                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>
                      {i18nT(getRideStatusLabel(activeRide.status))}
                    </Text>
                  </View>
                  <Text style={styles.tripCode}>
                    {i18nT("Chuyến #")} {i18nT(activeRide.id)}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.tripRoute}>
                  {i18nT(activeRide.pickupAddress || "Chưa có địa chỉ điểm đón")}
                </Text>
                <Text numberOfLines={1} style={styles.tripRoute}>
                  →{" "}
                  {i18nT(
                    activeRide.dropoffAddress || "Chưa có địa chỉ điểm đến",
                  )}
                </Text>
                <View style={styles.rideFareRow}>
                  <Text style={styles.pickupLabel}>
                    {i18nT(
                      activeRide.finalFare === null
                        ? "Giá dự kiến"
                        : "Giá cuối cùng",
                    )}
                  </Text>
                  <Text style={styles.rideFareValue}>
                    {i18nT(
                      formatCurrency(
                        activeRide.finalFare ?? activeRide.estimatedFare,
                      ),
                    )}
                  </Text>
                </View>
              </Card>
            ) : null}

            <View style={styles.locateRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18nT("Về vị trí hiện tại")}
                onPress={recenter}
                style={styles.locateButton}
              >
                <MaterialIcons
                  color={colors.primary}
                  name="gps-fixed"
                  size={fontSize.icon2xl}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <CustomerTabBar active="home" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
