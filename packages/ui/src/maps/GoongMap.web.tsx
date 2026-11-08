import { translate as t } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { getVersion, Map, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Typography as Text } from '../components/Typography';
import { useThemeColors } from '../theme/ThemeProvider';
import { CURRENT_LOCATION_BLUE, CURRENT_LOCATION_RING, TRIP_ROUTE_CASING, TRIP_ROUTE_COLOR, TRIP_STOP_COLORS } from '../theme/mapColors';
import { DEFAULT_MAP_ZOOM, MAX_ROUTE_ZOOM, goongStyleUrl, lngLat, mapPadding } from './geometry';
import type { GoongMapProps } from './types';
import { MapCameraSelection } from './MapCameraSelection';

export function GoongMap({
  mapKey, center, viewport, bounds, cameraVersion, markers, route, currentLocation, interactive = true, editablePin,
  onCenterChange, onReadyChange, onMovingChange,
}: GoongMapProps) {
  const colors = useThemeColors();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const initial = useRef(center);
  const settledCenter = useRef(center);
  const [selectionEvents] = useState(() => new MapCameraSelection());
  const callbacks = useRef({ onCenterChange, onReadyChange, onMovingChange });
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(mapKey ? 'loading' : 'failed');
  const style = goongStyleUrl(mapKey);
  const { lat, lng } = center;
  const [west, south, east, north] = bounds ?? [];
  const hasBounds = Boolean(bounds);
  const currentLat = currentLocation?.lat;
  const currentLng = currentLocation?.lng;
  const top = viewport?.top ?? 0;
  const bottom = viewport?.bottom ?? 0;

  useEffect(() => { callbacks.current = { onCenterChange, onReadyChange, onMovingChange }; }, [onCenterChange, onReadyChange, onMovingChange]);
  useEffect(() => { callbacks.current.onReadyChange?.(status === 'ready'); }, [status]);
  useEffect(() => {
    if (!style || !container.current) return;
    try {
      const basePath = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
      setWorkerUrl(new URL(`${basePath}/maplibre-gl-worker.mjs?v=${getVersion()}`, window.location.origin).href);
      const instance = new Map({
        container: container.current, style, center: lngLat(initial.current), zoom: DEFAULT_MAP_ZOOM, maxZoom: 19,
        interactive, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true },
      });
      map.current = instance;
      instance.once('load', () => setStatus('ready'));
      instance.on('error', ({ error }) => {
        // A tile can fail transiently after the map is usable.
        if (error && !instance.getStyle()?.layers?.length) setStatus('failed');
      });
      instance.on('movestart', event => {
        if (!editablePin || selectionEvents.begin(Boolean(event.originalEvent))) callbacks.current.onMovingChange?.(true);
      });
      instance.on('moveend', event => {
        if (editablePin && !selectionEvents.idle(Boolean(event.originalEvent))) return;
        const point = instance.getCenter();
        settledCenter.current = { lat: point.lat, lng: point.lng };
        callbacks.current.onCenterChange?.(settledCenter.current);
        callbacks.current.onMovingChange?.(false);
      });
      const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => instance.resize()) : null;
      resize?.observe(container.current);
      return () => { resize?.disconnect(); instance.remove(); map.current = null; };
    } catch {
      queueMicrotask(() => setStatus('failed'));
    }
  }, [style, interactive, editablePin, selectionEvents]);

  useEffect(() => {
    if (status === 'ready' && !hasBounds) {
      selectionEvents.request();
      settledCenter.current = { lat, lng };
      map.current?.jumpTo({ center: [lng, lat] });
    }
    // A new center can explicitly recenter the pin without recentering on a sheet resize.
  }, [lat, lng, status, hasBounds, cameraVersion, selectionEvents]);

  useEffect(() => {
    const instance = map.current;
    if (status !== 'ready' || !instance) return;
    const padding = mapPadding({ top, bottom });
    if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
      instance.fitBounds([[west, south], [east, north]], { padding, maxZoom: MAX_ROUTE_ZOOM, duration: 350 });
    } else if (editablePin) {
      instance.jumpTo({ center: lngLat(settledCenter.current), padding });
    } else {
      instance.setPadding(padding);
    }
    const attribution = instance.getContainer().querySelector<HTMLElement>('.maplibregl-ctrl-bottom-right');
    if (attribution) attribution.style.bottom = `${bottom}px`;
  }, [bottom, cameraVersion, east, editablePin, north, south, status, top, west]);

  useEffect(() => {
    const instance = map.current;
    if (status !== 'ready' || !instance) return;
    const items = (markers ?? []).map(({ coordinate, kind }) => {
      const element = document.createElement('div');
      if (kind === 'pickup' || kind === 'dropoff') {
        const pin = new Marker({ color: TRIP_STOP_COLORS[kind], anchor: 'bottom' });
        const element = pin.getElement();
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', t(kind === 'pickup' ? 'Điểm đón' : 'Điểm đến'));
        return pin.setLngLat(lngLat(coordinate)).addTo(instance);
      }
      const color = kind === 'nearby' ? colors.error : colors.primary;
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', t('Tài xế'));
      const glyph = MaterialIcons.getRawGlyphMap()['directions-car'];
      element.textContent = kind === 'nearby' ? '🚘' : typeof glyph === 'number' ? String.fromCodePoint(glyph) : glyph;
      Object.assign(element.style, {
        width: '36px', height: '36px', boxSizing: 'border-box', borderRadius: '50%',
        display: 'grid', placeItems: 'center', border: `2px solid ${color}`, background: colors.cardSurface,
        color, fontFamily: MaterialIcons.getFontFamily(), fontSize: '22px', lineHeight: '1',
      });
      return new Marker({ element, anchor: kind === 'nearby' ? 'bottom' : 'center' })
        .setLngLat(lngLat(coordinate)).addTo(instance);
    });
    return () => items.forEach(marker => marker.remove());
  }, [colors.cardSurface, colors.error, colors.primary, markers, status]);

  useEffect(() => {
    const instance = map.current;
    if (status !== 'ready' || !instance || currentLat === undefined || currentLng === undefined) return;
    const element = document.createElement('div');
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', t('Vị trí hiện tại'));
    Object.assign(element.style, {
      width: '19px', height: '19px', boxSizing: 'border-box', borderRadius: '50%',
      border: `2.5px solid ${CURRENT_LOCATION_RING}`, backgroundColor: CURRENT_LOCATION_BLUE, zIndex: '1',
    });
    const marker = new Marker({ element }).setLngLat([currentLng, currentLat]).addTo(instance);
    return () => { marker.remove(); };
  }, [currentLat, currentLng, status]);

  useEffect(() => {
    const instance = map.current;
    if (status !== 'ready' || !instance) return;
    const data: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: (route ?? []).map(lngLat) },
    };
    const source = instance.getSource<GeoJSONSource>('trip-route');
    if (data.geometry.coordinates.length < 2) {
      if (source) {
        instance.removeLayer('trip-route-line');
        instance.removeLayer('trip-route-casing');
        instance.removeSource('trip-route');
      }
    } else if (source) {
      source.setData(data);
    } else {
      instance.addSource('trip-route', { type: 'geojson', data });
      instance.addLayer({
        id: 'trip-route-casing', type: 'line', source: 'trip-route',
        paint: { 'line-color': TRIP_ROUTE_CASING, 'line-width': 8 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      instance.addLayer({
        id: 'trip-route-line', type: 'line', source: 'trip-route',
        paint: { 'line-color': TRIP_ROUTE_COLOR, 'line-width': 5 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }
  }, [route, status]);

  return (
    <View style={styles.fill}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {status !== 'ready' ? (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceContainer, top, bottom }]}>
          {status === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
          <Text>{t(status === 'loading' ? 'Đang tải bản đồ…' : 'Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau.')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
});
