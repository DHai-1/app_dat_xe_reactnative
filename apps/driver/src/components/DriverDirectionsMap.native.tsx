import { env } from '@/config/env';
import { initializeMapbox } from '@/lib/initializeMapbox';
import type { RideCoordinates } from '@datxe/shared';
import Mapbox, { Camera, CircleLayer, MapView, ShapeSource } from '@rnmapbox/maps';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

type Props = { destination: RideCoordinates };

export function DriverDirectionsMap({ destination }: Props) {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState<RideCoordinates | null>(null);
  const camera = useRef<Camera>(null);

  useEffect(() => {
    let active = true;
    void initializeMapbox(Mapbox, env.mapboxToken).then(value => { if (active) setReady(value); });
    void Location.getForegroundPermissionsAsync().then(permission => {
      if (!permission.granted) return;
      return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    }).then(position => {
      if (active && position) setCurrent({ lat: position.coords.latitude, lng: position.coords.longitude });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const points = [current, destination].filter((point): point is RideCoordinates => Boolean(point));
  const bounds = points.length > 1 ? {
    ne: [Math.max(...points.map(point => point.lng)) + 0.002, Math.max(...points.map(point => point.lat)) + 0.002],
    sw: [Math.min(...points.map(point => point.lng)) - 0.002, Math.min(...points.map(point => point.lat)) - 0.002],
    paddingTop: 100, paddingBottom: 180, paddingLeft: 45, paddingRight: 45,
  } : undefined;
  const markerPoints: RideCoordinates[] = [current, destination].filter((point): point is RideCoordinates => Boolean(point));
  const markers = useMemo(() => ({ type: 'FeatureCollection' as const, features: markerPoints.map((point, kind) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [point.lng, point.lat] },
    properties: { kind },
  })) }), [markerPoints]);

  if (!ready) return <View style={styles.empty}><ActivityIndicator color="#B42318" /><Text style={styles.emptyText}>Đang mở bản đồ…</Text></View>;
  return <MapView style={StyleSheet.absoluteFill} styleURL="mapbox://styles/mapbox/streets-v12" scrollEnabled zoomEnabled rotateEnabled={false} pitchEnabled={false}>
    <Camera ref={camera} bounds={bounds} defaultSettings={{ centerCoordinate: [destination.lng, destination.lat], zoomLevel: 15 }} animationDuration={450} />
    <ShapeSource id="driver-directions-points" shape={markers}>
      <CircleLayer id="driver-current-location" filter={['==', ['get', 'kind'], 0]} style={{ circleColor: '#2563EB', circleRadius: 8, circleStrokeWidth: 3, circleStrokeColor: '#FFFFFF' }} />
      <CircleLayer id="driver-pickup-location" filter={['==', ['get', 'kind'], 1]} style={{ circleColor: '#B42318', circleRadius: 10, circleStrokeWidth: 3, circleStrokeColor: '#FFFFFF' }} />
    </ShapeSource>
    <Mapbox.MarkerView coordinate={[destination.lng, destination.lat]} anchor={{ x: 0.5, y: 1 }}>
      <View style={styles.pin}><Text style={styles.pinText}>●</Text></View>
    </Mapbox.MarkerView>
  </MapView>;
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F7', gap: 10 },
  emptyText: { color: '#667085' },
  pin: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#B42318', borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pinText: { color: '#FFFFFF', fontSize: 12 },
});
