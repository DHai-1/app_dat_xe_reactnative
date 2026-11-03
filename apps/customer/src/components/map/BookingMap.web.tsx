import { env } from "@/config/env";
import { translate as i18nT } from "@datxe/shared";
import {
  Typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { BookingMapProps } from "./types";

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
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const callbacks = useRef({ onCenterChange, onReadyChange, onMovingChange });
  const initial = useRef({
    center,
    pickup,
    dropoff,
    interactive,
    editablePin,
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!env.mapboxToken);
  useEffect(() => {
    callbacks.current = { onCenterChange, onReadyChange, onMovingChange };
  }, [onCenterChange, onReadyChange, onMovingChange]);
  useEffect(() => {
    if (!container.current || !env.mapboxToken) {
      callbacks.current.onReadyChange?.(false);
      return;
    }
    const state = initial.current;
    try {
      const instance = new mapboxgl.Map({
        container: container.current,
        accessToken: env.mapboxToken,
        style: lightStyle,
        center: [state.center.lng, state.center.lat],
        zoom: 15,
        interactive: state.interactive,
        attributionControl: true,
      });
      map.current = instance;
      instance.on("load", () => {
        setReady(true);
        callbacks.current.onReadyChange?.(true);
        if (state.pickup && state.dropoff)
          instance.fitBounds(
            [
              [state.pickup.coordinate.lng, state.pickup.coordinate.lat],
              [state.dropoff.coordinate.lng, state.dropoff.coordinate.lat],
            ],
            { padding: 45, maxZoom: 16, duration: 0 },
          );
        const point = instance.getCenter();
        callbacks.current.onCenterChange?.({ lat: point.lat, lng: point.lng });
      });
      instance.on("movestart", () => callbacks.current.onMovingChange?.(true));
      instance.on("moveend", () => {
        const point = instance.getCenter();
        callbacks.current.onCenterChange?.({ lat: point.lat, lng: point.lng });
        callbacks.current.onMovingChange?.(false);
      });
      instance.on("click", (event) => {
        if (state.interactive && !state.editablePin)
          instance.easeTo({ center: event.lngLat, duration: 300 });
      });
      instance.on("error", () => {
        setFailed(true);
        callbacks.current.onReadyChange?.(false);
      });
    } catch {
      Promise.resolve().then(() => {
        setFailed(true);
        callbacks.current.onReadyChange?.(false);
      });
    }
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!dropoff)
      map.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });
  }, [center.lat, center.lng, dropoff]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const markers = [pickup?.coordinate, dropoff?.coordinate, driver].flatMap(
      (point, index) =>
        point
          ? [
              new mapboxgl.Marker({
                color: [colors.success, colors.error, colors.primary][index],
              })
                .setLngLat([point.lng, point.lat])
                .addTo(instance),
            ]
          : [],
    );
    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [pickup, dropoff, driver, ready, colors]);
  useEffect(() => {
    const instance = map.current;
    if (
      ready &&
      instance &&
      driver &&
      !instance.getBounds().contains([driver.lng, driver.lat])
    ) {
      instance.fitBounds(
        instance.getBounds().extend([driver.lng, driver.lat]),
        { padding: 45, maxZoom: 16 },
      );
    }
  }, [driver, ready]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const updateRoute = () => {
      const data: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: (route ?? []).map((point) => [point.lng, point.lat]),
        },
        properties: {},
      };
      const source = instance.getSource("booking-route") as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (source) {
        source.setData(data);
        instance.setPaintProperty(
          "booking-route-line",
          "line-color",
          colors.primary,
        );
      } else if (data.geometry.coordinates.length > 1) {
        instance.addSource("booking-route", { type: "geojson", data });
        instance.addLayer({
          id: "booking-route-line",
          type: "line",
          source: "booking-route",
          paint: { "line-color": colors.primary, "line-width": 5 },
        });
      }
    };
    if (instance.isStyleLoaded()) updateRoute();
    instance.on("style.load", updateRoute);
    return () => {
      instance.off("style.load", updateRoute);
    };
  }, [route, ready, colors.primary]);
  return (
    <View style={styles.flex}>
      <div ref={container} style={mapContainerStyle} />
      {failed ? (
        <View style={styles.empty}>
          <Typography style={styles.muted}>
            {i18nT("Bản đồ chưa khả dụng. Bạn vẫn có thể tìm và chọn địa chỉ.")}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
const lightStyle = "mapbox://styles/mapbox/streets-v12";
const mapContainerStyle = { position: "absolute" as const, inset: 0 };
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    empty: {
      flex: 1,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceContainer,
    },
    muted: { color: colors.onSurfaceVariant },
  });
