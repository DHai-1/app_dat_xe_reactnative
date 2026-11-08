import { translate as t } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Images, Layer, Map, ViewAnnotation, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Typography as Text } from '../components/Typography';
import { useThemeColors } from '../theme/ThemeProvider';
import { CURRENT_LOCATION_BLUE, CURRENT_LOCATION_RING, TRIP_ROUTE_CASING, TRIP_ROUTE_COLOR } from '../theme/mapColors';
import { DEFAULT_MAP_ZOOM, goongStyleUrl, lngLat, mapPadding } from './geometry';
import type { GoongMapProps } from './types';
import { MapCameraSelection } from './MapCameraSelection';

const stopImages = {
  pickup: require('./assets/pickup-pin.png'),
  dropoff: require('./assets/dropoff-pin.png'),
};

const locationImages = { heading: require('./assets/location-heading.png') };

export function GoongMap({
  mapKey, center, viewport, bounds, cameraVersion, markers = [], route, currentLocation, currentHeading, interactive = true, editablePin,
  onCenterChange, onReadyChange, onMovingChange,
}: GoongMapProps) {
  const colors = useThemeColors();
  const camera = useRef<CameraRef>(null);
  const [selectionEvents] = useState(() => new MapCameraSelection());
  const cameraConfigured = useRef(false);
  const initialCamera = useRef({ center: lngLat(center), zoom: DEFAULT_MAP_ZOOM, padding: mapPadding(viewport) });
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(mapKey ? 'loading' : 'failed');
  const requestedCenter = useRef(center);
  const requestedCameraVersion = useRef(cameraVersion);
  const settledCenter = useRef(center);
  const callbacks = useRef({ onCenterChange, onReadyChange, onMovingChange });
  const style = goongStyleUrl(mapKey);
  const { lat, lng } = center;
  const [west, south, east, north] = bounds ?? [];
  const top = viewport?.top ?? 0;
  const bottom = viewport?.bottom ?? 0;

  const stops = useMemo(() => markers.flatMap(({ kind, coordinate }) => kind === 'pickup' || kind === 'dropoff' ? [{
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: lngLat(coordinate) },
    properties: { kind },
  }] : []), [markers]);
  const routeLine = useMemo(() => route && route.length > 1
    ? { type: 'LineString' as const, coordinates: route.map(lngLat) } : null, [route]);

  useEffect(() => { callbacks.current = { onCenterChange, onReadyChange, onMovingChange }; }, [onCenterChange, onReadyChange, onMovingChange]);
  useEffect(() => { callbacks.current.onReadyChange?.(status === 'ready'); }, [status]);

  useEffect(() => {
    if (status !== 'ready') return;
    const padding = mapPadding({ top, bottom });
    if (!cameraConfigured.current || requestedCenter.current.lat !== lat || requestedCenter.current.lng !== lng || requestedCameraVersion.current !== cameraVersion) {
      cameraConfigured.current = true;
      selectionEvents.request();
      requestedCenter.current = { lat, lng };
      requestedCameraVersion.current = cameraVersion;
      settledCenter.current = requestedCenter.current;
    }
    if (west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
      camera.current?.fitBounds([west, south, east, north], { padding, duration: 350 });
    } else {
      // With an editable pin, the logical map center stays under the pin when the sheet moves.
      camera.current?.jumpTo({ center: lngLat(settledCenter.current), padding });
    }
  }, [bottom, cameraVersion, east, editablePin, lat, lng, north, south, status, top, west, selectionEvents]);

  return (
    <View style={styles.fill}>
      {style && status !== 'failed' ? (
        <Map
          style={StyleSheet.absoluteFill} mapStyle={style} androidView="texture"
          dragPan={interactive} touchZoom={interactive} doubleTapZoom={interactive}
          touchRotate={false} touchPitch={false} logo={false}
          attributionPosition={{ bottom: bottom + 8, left: 8 }}
          onDidFinishLoadingMap={() => setStatus('ready')}
          onDidFailLoadingMap={() => setStatus('failed')}
          onRegionWillChange={({ nativeEvent }) => {
            if (!editablePin || selectionEvents.begin(nativeEvent.userInteraction)) callbacks.current.onMovingChange?.(true);
          }}
          onRegionDidChange={({ nativeEvent }) => {
            if (editablePin && !selectionEvents.idle(nativeEvent.userInteraction)) return;
            const [nextLng, nextLat] = nativeEvent.center;
            settledCenter.current = { lng: nextLng, lat: nextLat };
            callbacks.current.onCenterChange?.(settledCenter.current);
            callbacks.current.onMovingChange?.(false);
          }}
        >
          <Camera ref={camera} maxZoom={19}
            initialViewState={initialCamera.current} />
          {routeLine ? (
            <GeoJSONSource id="trip-route" data={routeLine}>
              <Layer id="trip-route-casing" type="line"
                paint={{ 'line-color': TRIP_ROUTE_CASING, 'line-width': 8 }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
              <Layer id="trip-route-line" type="line"
                paint={{ 'line-color': TRIP_ROUTE_COLOR, 'line-width': 5 }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            </GeoJSONSource>
          ) : null}
          {stops.length ? (
            <>
              <Images images={stopImages} />
              <GeoJSONSource id="trip-stops" data={{ type: 'FeatureCollection', features: stops }}>
                <Layer id="trip-stop-pins" type="symbol"
                  layout={{ 'icon-image': ['get', 'kind'], 'icon-anchor': 'bottom', 'icon-allow-overlap': true }} />
              </GeoJSONSource>
            </>
          ) : null}
          {currentLocation ? (
            <>
              <Images images={locationImages} />
              <GeoJSONSource id="current-location" data={{
                type: 'Feature', geometry: { type: 'Point', coordinates: lngLat(currentLocation) },
                properties: { heading: currentHeading ?? 0 },
              }}>
                <Layer id="current-location-heading" type="symbol" layout={{
                  'icon-image': 'heading',
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  'icon-rotate': ['get', 'heading'],
                  'icon-rotation-alignment': 'map',
                }} paint={{ 'icon-opacity': currentHeading != null ? 1 : 0 }} />
                <Layer id="current-location-dot" type="circle" paint={{
                  'circle-radius': 7,
                  'circle-color': CURRENT_LOCATION_BLUE,
                  'circle-stroke-width': 2.5,
                  'circle-stroke-color': CURRENT_LOCATION_RING,
                }} />
              </GeoJSONSource>
            </>
          ) : null}
          {markers.map(({ id, coordinate, kind }) => {
            if (kind === 'pickup' || kind === 'dropoff') return null;
            const color = kind === 'nearby' ? colors.error : colors.primary;
            return (
              <ViewAnnotation key={id} id={id} lngLat={lngLat(coordinate)} anchor={kind === 'nearby' ? 'bottom' : 'center'}>
                <View collapsable={false} accessible accessibilityLabel={t('Tài xế')}
                  style={[styles.markerRing, { backgroundColor: color }]}>
                  <View style={[styles.markerFace, { backgroundColor: colors.cardSurface }]}>
                    {kind === 'nearby' ? <Text style={styles.car}>🚘</Text> : (
                      <MaterialIcons name="directions-car" size={22} color={color} />
                    )}
                  </View>
                </View>
              </ViewAnnotation>
            );
          })}
        </Map>
      ) : null}
      {status !== 'ready' ? (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceContainer, top, bottom }]} pointerEvents="none">
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
  markerRing: { width: 36, height: 36, borderRadius: 18, padding: 2 },
  markerFace: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  car: { fontSize: 20, lineHeight: 24 },
});
