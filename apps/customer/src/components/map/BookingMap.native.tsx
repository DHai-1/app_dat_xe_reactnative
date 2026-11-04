import { env } from "@/config/env";
import { initializeMapbox } from "@/lib/initializeMapbox";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import Mapbox, {
  Camera,
  CircleLayer,
  Images,
  SymbolLayer,
  LineLayer,
  MapView,
  ShapeSource,
} from "@rnmapbox/maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { bookingStyles as base_s } from "./mapStyles";
import type { BookingMapProps } from "./types";

/** Một kiểu marker duy nhất dùng chung cho cả điểm đón và điểm đến. */
const pinMarker = require("../../../assets/images/marker-pin.png");

export function BookingMap({
  center,
  pickup,
  dropoff,
  driver,
  route,
  interactive = true,
  editablePin = false,
  onCenterChange,
  onReadyChange,
  onMovingChange,
}: BookingMapProps) {
  const extra = useThemedStyles(extraStyles);

  const colors = useThemeColors();

  useLanguage();

  const s = useThemedStyles(base_s);

  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [initialCamera] = useState({
    centerCoordinate: [center.lng, center.lat],
    zoomLevel: 15,
  });
  const camera = useRef<Camera>(null);
  const readyCallback = useRef(onReadyChange);
  const centerCallback = useRef(onCenterChange);
  const movingCallback = useRef(onMovingChange);
  useEffect(() => {
    readyCallback.current = onReadyChange;
    centerCallback.current = onCenterChange;
    movingCallback.current = onMovingChange;
  }, [onCenterChange, onMovingChange, onReadyChange]);
  useEffect(() => {
    let active = true;
    void initializeMapbox(Mapbox, env.mapboxToken).then(
      (ready) => {
        if (active) {
          setStatus(ready ? "ready" : "unavailable");
          readyCallback.current?.(ready);
        }
      },
      () => {
        if (active) {
          setStatus("unavailable");
          readyCallback.current?.(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (status !== "ready" || dropoff) return undefined;
    camera.current?.setCamera({
      centerCoordinate: [center.lng, center.lat],
      zoomLevel: 16,
      animationDuration: 350,
    });
    // Một số bản Mapbox không bắn onMapIdle sau animation lập trình: fallback để
    // màn ghim không bị kẹt ở trạng thái "đang xác định địa chỉ".
    const timer = setTimeout(() => {
      if (!editablePin) centerCallback.current?.({ lat: center.lat, lng: center.lng });
      movingCallback.current?.(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [center.lat, center.lng, dropoff, editablePin, status]);
  const markers = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: [
        pickup,
        dropoff,
        driver ? { coordinate: driver } : null,
      ].flatMap((place, index) =>
        place
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [place.coordinate.lng, place.coordinate.lat],
                },
                properties: { kind: index },
              },
            ]
          : [],
      ),
    }),
    [pickup, dropoff, driver],
  );
  const line = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: (route ?? []).map((point) => [point.lng, point.lat]),
      },
      properties: {},
    }),
    [route],
  );
  const points = [pickup?.coordinate, dropoff?.coordinate, driver].filter(
    (point): point is { lat: number; lng: number } => Boolean(point),
  );
  const bounds =
    points.length >= 2
      ? {
          ne: [
            Math.max(...points.map((point) => point.lng)) + 0.002,
            Math.max(...points.map((point) => point.lat)) + 0.002,
          ],
          sw: [
            Math.min(...points.map((point) => point.lng)) - 0.002,
            Math.min(...points.map((point) => point.lat)) - 0.002,
          ],
          paddingTop: 45,
          paddingBottom: 45,
          paddingLeft: 40,
          paddingRight: 40,
        }
      : undefined;
  if (status !== "ready")
    return (
      <View style={[s.flex, s.empty, extra.item1]}>
        {status === "loading" ? <ActivityIndicator /> : null}
        <Text style={s.muted}>
          {i18nT(
            status === "loading"
              ? "Đang mở bản đồ…"
              : "Bản đồ chưa khả dụng. Bạn vẫn có thể tìm và chọn địa chỉ.",
          )}
        </Text>
      </View>
    );
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      styleURL="mapbox://styles/mapbox/streets-v12"
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      scaleBarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onCameraChanged={() => onMovingChange?.(true)}
      onMapIdle={(event) => {
        const [lng, lat] = event.properties.center;
        if (!editablePin) onCenterChange?.({ lat, lng });
        onMovingChange?.(false);
      }}
      onPress={(event) => {
        if (!interactive || event.geometry.type !== "Point") return;
        if (editablePin) {
          const [lng, lat] = event.geometry.coordinates;
          onCenterChange?.({ lat, lng });
        } else if (!onCenterChange) {
          camera.current?.setCamera({
            centerCoordinate: event.geometry.coordinates,
            animationDuration: 300,
          });
        }
      }}
      onMapLoadingError={() => {
        setStatus("unavailable");
        readyCallback.current?.(false);
      }}
    >
      <Camera
        ref={camera}
        bounds={bounds}
        defaultSettings={initialCamera}
        animationDuration={400}
      />
      {line.geometry.coordinates.length > 1 ? (
        <ShapeSource id="booking-route" shape={line}>
          <LineLayer
            id="booking-route-line"
            style={{
              lineColor: colors.primary,
              lineWidth: 5,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </ShapeSource>
      ) : null}
      <Images images={{ "marker-pin": pinMarker }} />
      <ShapeSource id="booking-points" shape={markers}>
        <SymbolLayer
          id="booking-pickup"
          filter={["==", ["get", "kind"], 0]}
          style={{
            iconImage: "marker-pin",
            iconSize: 0.4,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
        <SymbolLayer
          id="booking-dropoff"
          filter={["==", ["get", "kind"], 1]}
          style={{
            iconImage: "marker-pin",
            iconSize: 0.4,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
        <CircleLayer
          id="live-driver"
          filter={["==", ["get", "kind"], 2]}
          style={{
            circleColor: colors.primary,
            circleRadius: 10,
            circleStrokeWidth: 4,
            circleStrokeColor: colors.onPrimary,
          }}
        />
      </ShapeSource>
    </MapView>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      justifyContent: "center",
      backgroundColor: colors.surfaceContainer,
    },
  });
