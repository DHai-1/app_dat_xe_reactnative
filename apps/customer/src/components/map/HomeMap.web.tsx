import { env } from "@/config/env";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  borderRadius,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useMemo } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import type { NearbyDriverMarker, RideCoordinates } from "@datxe/shared";

type HomeMapProps = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  /** Bản đồ phủ toàn màn hình (trang chủ), ẩn tiêu đề và chú thích. */
  fullscreen?: boolean;
  /** Giữ tương thích API với bản native. */
  recenterToken?: number;
};

const mapboxToken = env.mapboxToken;

export function HomeMap({
  coordinate,
  drivers,
  fullscreen = false,
  recenterToken = 0,
}: HomeMapProps) {
  const colors = useThemeColors();

  useLanguage();

  const styles = useThemedStyles(base_styles);

  const imageUrl = useMemo(() => {
    if (!coordinate || !mapboxToken) return null;
    const features = [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [coordinate.lng, coordinate.lat],
        },
        properties: {
          "marker-color": colors.primary,
          "marker-size": "large",
          "marker-symbol": "circle",
        },
      },
      ...drivers.map(({ location }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        properties: {
          "marker-color": colors.success,
          "marker-size": "medium",
          "marker-symbol": "car",
        },
      })),
    ];
    const overlay = encodeURIComponent(
      JSON.stringify({ type: "FeatureCollection", features }),
    );
    const center = `${coordinate.lng},${coordinate.lat},13.5`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${overlay})/${center}/800x560?attribution=true&logo=true&access_token=${encodeURIComponent(mapboxToken)}`;
  }, [coordinate, drivers, colors.primary, colors.success]);

  return (
    <View style={fullscreen ? extra.fullRoot : styles.section}>
      {fullscreen ? null : (
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{i18nT("Tài xế quanh bạn")}</Text>
          <Text style={styles.subtitle}>
            {i18nT("Vị trí tài xế được hiển thị gần đúng để bảo vệ riêng tư")}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>{i18nT(drivers.length)}</Text>
        </View>
      </View>
      )}

      <View style={fullscreen ? extra.fullFrame : styles.mapFrame}>
        {imageUrl ? (
          <ImageBackground
            accessibilityLabel={i18nT(
              "Bản đồ vị trí hiện tại và các tài xế đang trực tuyến gần đó",
            )}
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.fallbackText}>
              {i18nT(
                coordinate
                  ? "Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau."
                  : "Cho phép truy cập vị trí để xem bản đồ quanh bạn.",
              )}
            </Text>
          </View>
        )}
      </View>

      {fullscreen ? null : (
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.passengerDot} />
          <Text style={styles.legendText}>{i18nT("Bạn")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.driverDot} />
          <Text style={styles.legendText}>
            {i18nT("Tài xế đang trực tuyến")}
          </Text>
        </View>
      </View>
      )}
    </View>
  );
}

const extra = { fullRoot: { flex: 1 }, fullFrame: { flex: 1, overflow: "hidden" } } as const;

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: { gap: spacing.spaceSm },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
    },
    headingCopy: { flex: 1, gap: spacing.py0_5 },
    title: { ...typography.titleMd, color: colors.onSurface },
    subtitle: { ...typography.labelSm, color: colors.onSurfaceVariant },
    countBadge: {
      minWidth: spacing.iconButtonSm,
      height: spacing.iconButtonSm - spacing.px1_5,
      paddingHorizontal: spacing.spaceSm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceXs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerLow,
    },
    countDot: {
      width: 7,
      height: 7,
      borderRadius: borderRadius.full,
      backgroundColor: colors.emerald,
    },
    countText: { ...typography.labelMd, color: colors.onSurface },
    mapFrame: {
      height: 300,
      overflow: "hidden",
      borderRadius: borderRadius.xxl,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    mapFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.spaceLg,
    },
    fallbackText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceLg,
      paddingHorizontal: spacing.spaceXs,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
    },
    passengerDot: {
      width: 10,
      height: 10,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    driverDot: {
      width: 10,
      height: 10,
      borderRadius: borderRadius.full,
      backgroundColor: colors.success,
    },
    legendText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  });
