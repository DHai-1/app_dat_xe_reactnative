import { env } from "@/config/env";
import { initializeMapbox } from "@/lib/initializeMapbox";
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
import Mapbox, {
  Camera,
  Images,
  MapView,
  PointAnnotation,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import type { NearbyDriverMarker, RideCoordinates } from "@datxe/shared";

/** Logo PtitGo dùng làm thẻ vị trí của người dùng trên bản đồ. */
const brandMark = require("../../../assets/images/brand-mark.png");

type HomeMapProps = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  /** Bản đồ phủ toàn màn hình (trang chủ), ẩn tiêu đề và chú thích. */
  fullscreen?: boolean;
  /** Tăng giá trị này để camera quay lại vị trí người dùng. */
  recenterToken?: number;
};


const mapboxToken = env.mapboxToken;

export function HomeMap({
  coordinate,
  drivers,
  fullscreen = false,
  recenterToken = 0,
}: HomeMapProps) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const camera = useRef<Camera>(null);
  const lastRecenter = useRef(0);

  const [mapStatus, setMapStatus] = useState<
    "loading" | "ready" | "unavailable"
  >(mapboxToken ? "loading" : "unavailable");

  // Chỉ căn lại camera (có animation) khi người dùng bấm nút mục tiêu.
  // Lần mount đầu dùng defaultSettings nên bản đồ hiện đúng zoom ngay, không bị zoom nhanh.
  useEffect(() => {
    if (recenterToken === lastRecenter.current) return;
    lastRecenter.current = recenterToken;
    if (!coordinate) return;
    camera.current?.setCamera({
      centerCoordinate: [coordinate.lng, coordinate.lat],
      zoomLevel: 13.5,
      animationMode: "easeTo",
      animationDuration: 500,
    });
  }, [coordinate, recenterToken]);

  const passengerShape = useMemo(() => {
    if (!coordinate) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "passenger-location",
          geometry: {
            type: "Point" as const,
            coordinates: [coordinate.lng, coordinate.lat],
          },
          properties: {},
        },
      ],
    };
  }, [coordinate]);

  useEffect(() => {
    let mounted = true;
    void initializeMapbox(Mapbox, mapboxToken).then(
      (ready) => {
        if (mounted) setMapStatus(ready ? "ready" : "unavailable");
      },
      () => {
        if (mounted) setMapStatus("unavailable");
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const fallbackMessage = !coordinate
    ? i18nT("Cho phép truy cập vị trí để xem bản đồ quanh bạn.")
    : mapStatus === "unavailable"
      ? i18nT("Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau.")
      : i18nT("Đang tải bản đồ…");

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
        {coordinate && mapStatus === "ready" ? (
          <MapView
            style={StyleSheet.absoluteFill}
            styleURL="mapbox://styles/mapbox/streets-v11"

            compassEnabled={!fullscreen}
            compassViewPosition={1}
            scaleBarEnabled={false}
            attributionEnabled
            logoEnabled
            onMapLoadingError={() => setMapStatus("unavailable")}
          >
            <Camera
              ref={camera}
              defaultSettings={{
                centerCoordinate: [coordinate.lng, coordinate.lat],
                zoomLevel: 13.5,
              }}
            />
            {drivers.map((driver, index) => (
              <PointAnnotation
                key={String(index)}
                id={"driver-" + index}
                coordinate={[driver.location.lng, driver.location.lat]}
              >
                <View style={extra.item1}>
                  <Text style={extra.item2}>🚘</Text>
                </View>
              </PointAnnotation>
            ))}

            {/* Logo PtitGo (đã tách nền) làm marker vị trí: dùng SymbolLayer để ảnh
                PNG trong suốt hiển thị đúng trên bề mặt bản đồ, không bị khung trắng. */}
            <Images images={{ "passenger-mark": brandMark }} />
            {passengerShape ? (
              <ShapeSource id="passenger-mark-source" shape={passengerShape}>
                <SymbolLayer
                  id="passenger-mark"
                  style={{
                    iconImage: "passenger-mark",
                    iconSize: 0.22,
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </ShapeSource>
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            {mapStatus === "loading" && coordinate ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            <Text style={styles.fallbackText}>{i18nT(fallbackMessage)}</Text>
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

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.spaceSm,
    },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
    },
    headingCopy: {
      flex: 1,
      gap: spacing.py0_5,
    },
    title: {
      ...typography.titleMd,
      color: colors.onSurface,
    },
    subtitle: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
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
    countText: {
      ...typography.labelMd,
      color: colors.onSurface,
    },
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
      gap: spacing.spaceSm,
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
    legendText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
  });

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fullRoot: { flex: 1 },
    fullFrame: { flex: 1, overflow: "hidden" },
    item1: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 20,
      padding: 6,
      borderWidth: 2,
      borderColor: colors.success,
    },
    item2: { fontSize: 22 },
  });
