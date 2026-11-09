import { env } from '@/config/env';
import type { RideCoordinates } from '@datxe/shared';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { destination: RideCoordinates; targetLabel?: string; vehicle?: 'car' | 'bike' };

type DirectionsStep = {
  instruction: string;
  distanceMeters: number;
  start: RideCoordinates;
  end: RideCoordinates;
};

type DirectionsRoute = {
  coordinates: RideCoordinates[];
  steps: DirectionsStep[];
};

type GoongDirectionsResponse = {
  status?: string;
  error_message?: string;
  error?: { message?: string };
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: Array<{
      distance?: { value?: number };
      steps?: Array<{
        html_instructions?: string;
        distance?: { value?: number };
        start_location?: { lat: number; lng: number };
        end_location?: { lat: number; lng: number };
        maneuver?: string;
      }>;
    }>;
  }>;
};

function trimHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function localizeInstruction(value: string): string {
  return value
    .replace(/^Turn right onto\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left onto\s+/i, 'Rẽ trái vào ')
    .replace(/^Turn right on\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left on\s+/i, 'Rẽ trái vào ')
    .replace(/^Continue straight onto\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight on\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight\s*$/i, 'Đi thẳng')
    .replace(/^Make a U-turn onto\s+/i, 'Quay đầu vào ')
    .replace(/^Head\s+/i, 'Đi ')
    .replace(/\bonto\b/gi, 'vào')
    .replace(/\bon the right\b/gi, 'bên phải')
    .replace(/\bon the left\b/gi, 'bên trái');
}

function decodePolyline(encoded: string): RideCoordinates[] {
  const points: RideCoordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

async function goongDirections(
  origin: RideCoordinates,
  destination: RideCoordinates,
  vehicle: 'car' | 'bike',
  key: string,
  signal: AbortSignal,
): Promise<DirectionsRoute> {
  const url = `https://rsapi.goong.io/Direction?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&vehicle=${vehicle}&api_key=${encodeURIComponent(key)}`;
  const response = await fetch(url, { signal });
  const data: GoongDirectionsResponse = await response.json();
  const leg = data.routes?.[0]?.legs?.[0];
  if (!leg) throw new Error(data.error_message || data.error?.message || 'Không lấy được đường đi.');
  const coordinates = decodePolyline(data.routes?.[0]?.overview_polyline?.points ?? '');
  const steps: DirectionsStep[] = (leg.steps ?? []).map(step => ({
    instruction: localizeInstruction(trimHtml(step.html_instructions ?? '')),
    distanceMeters: step.distance?.value ?? 0,
    start: { lat: step.start_location?.lat ?? 0, lng: step.start_location?.lng ?? 0 },
    end: { lat: step.end_location?.lat ?? 0, lng: step.end_location?.lng ?? 0 },
  }));
  return { coordinates, steps };
}

function distanceMeters(a: RideCoordinates, b: RideCoordinates): number {
  const radius = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function arrowFor(instruction: string): string {
  const value = instruction.toLowerCase();
  if (value.includes('trái') || value.includes('left')) return '←';
  if (value.includes('phải') || value.includes('right')) return '→';
  return '↑';
}

export function DriverDirectionsMap({ destination, targetLabel = 'điểm đón', vehicle = 'car' }: Props) {
  const camera = useRef<CameraRef>(null);
  const [current, setCurrent] = useState<RideCoordinates | null>(null);
  const [route, setRoute] = useState<DirectionsRoute | null>(null);
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const announced = useRef<Set<number>>(new Set());
  const voiceMutedRef = useRef(false);
  const overviewShown = useRef(false);
  const mapStyle = env.goongStyleUrl;

  useEffect(() => { voiceMutedRef.current = voiceMuted; }, [voiceMuted]);

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        if (active) setError('Cần quyền vị trí để chỉ đường.');
        return;
      }
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setCurrent({ lat: initial.coords.latitude, lng: initial.coords.longitude });
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        position => { if (active) setCurrent({ lat: position.coords.latitude, lng: position.coords.longitude }); },
      );
    })().catch(value => { if (active) setError(value?.message ?? 'Không lấy được vị trí.'); });
    return () => { active = false; subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (!current) return;
    const key = env.goongMapKey;
    if (!key) { setError('Thiếu EXPO_PUBLIC_GOONG_MAP_KEY để lấy đường đi.'); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void goongDirections(current, destination, vehicle, key, controller.signal)
        .then(next => {
          if (controller.signal.aborted) return;
          setRoute(next);
          setError('');
          announced.current = new Set();
          setStepIndex(0);
          overviewShown.current = false;
        })
        .catch(value => { if (!controller.signal.aborted) setError(value?.message ?? 'Không lấy được đường đi.'); });
    }, 400);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [current?.lat, current?.lng, destination.lat, destination.lng, vehicle]);

  useEffect(() => {
    if (!route || !current || route.steps.length === 0) return;
    let next = route.steps.length - 1;
    for (let index = 0; index < route.steps.length; index += 1) {
      if (distanceMeters(current, route.steps[index].end) > 15) { next = index; break; }
    }
    setStepIndex(next);
    if (!announced.current.has(next)) {
      announced.current.add(next);
      const text = route.steps[next]?.instruction;
      if (text && !voiceMutedRef.current) {
        void Speech.stop();
        Speech.speak(text, { language: 'vi-VN', rate: 0.95, pitch: 1 });
      }
    }
  }, [current, route]);

  useEffect(() => {
    if (!current) return;
    if (!overviewShown.current && route && route.coordinates.length > 1) {
      overviewShown.current = true;
      const lngs = route.coordinates.map(point => point.lng);
      const lats = route.coordinates.map(point => point.lat);
      camera.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: 120, bottom: 180, left: 40, right: 40 }, duration: 500 },
      );
      return;
    }
    camera.current?.jumpTo({ center: [current.lng, current.lat], zoom: 17 });
  }, [current, route]);

  const routeLine = useMemo(() => route && route.coordinates.length > 1
    ? { type: 'LineString' as const, coordinates: route.coordinates.map(point => [point.lng, point.lat] as [number, number]) }
    : null, [route]);

  const step = route?.steps[stepIndex];
  const remaining = current && step ? distanceMeters(current, step.end) : 0;

  if (!current) {
    return <View style={styles.empty}><ActivityIndicator color="#B42318" /><Text style={styles.emptyText}>Đang lấy vị trí hiện tại…</Text></View>;
  }
  if (error) {
    return <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text></View>;
  }
  if (!mapStyle) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Thiếu EXPO_PUBLIC_GOONG_MAP_KEY để hiển thị bản đồ.</Text></View>;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        androidView="texture"
        logo={false}
        attributionPosition={{ bottom: 8, left: 8 }}
      >
        <Camera ref={camera} maxZoom={19} initialViewState={{ center: [current.lng, current.lat], zoom: 17 }} />
        {routeLine ? (
          <GeoJSONSource id="driver-route" data={routeLine}>
            <Layer id="driver-route-casing" type="line"
              paint={{ 'line-color': '#FFFFFF', 'line-width': 8 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            <Layer id="driver-route-line" type="line"
              paint={{ 'line-color': '#B42318', 'line-width': 5 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
          </GeoJSONSource>
        ) : null}
        <GeoJSONSource id="driver-position" data={{
          type: 'Feature', geometry: { type: 'Point', coordinates: [current.lng, current.lat] }, properties: {},
        }}>
          <Layer id="driver-position-dot" type="circle" paint={{
            'circle-radius': 8, 'circle-color': '#2563EB', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF',
          }} />
        </GeoJSONSource>
        <GeoJSONSource id="driver-destination" data={{
          type: 'Feature', geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] }, properties: {},
        }}>
          <Layer id="driver-destination-dot" type="circle" paint={{
            'circle-radius': 9, 'circle-color': '#16A34A', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF',
          }} />
        </GeoJSONSource>
      </Map>
      <View style={styles.maneuver}>
        <Text style={styles.maneuverArrow}>{arrowFor(step?.instruction ?? '')}</Text>
        <View style={styles.maneuverCopy}>
          <Text style={styles.maneuverInstruction} numberOfLines={2}>
            {step?.instruction || (route ? `Đang đi tới ${targetLabel}` : 'Đang tính đường…')}
          </Text>
          <Text style={styles.maneuverDistance}>{formatDistance(remaining)}</Text>
        </View>
      </View>
      <View style={styles.mapControls}>
        <Pressable
          accessibilityLabel={voiceMuted ? 'Bật giọng chỉ đường' : 'Tắt giọng chỉ đường'}
          style={styles.mapControl}
          onPress={() => { const next = !voiceMuted; setVoiceMuted(next); if (next) void Speech.stop(); }}
        >
          <MaterialIcons name={voiceMuted ? 'volume-off' : 'volume-up'} size={22} color="#344054" />
        </Pressable>
        <Pressable
          accessibilityLabel="Theo dõi vị trí"
          style={styles.mapControl}
          onPress={() => { overviewShown.current = true; if (current) camera.current?.jumpTo({ center: [current.lng, current.lat], zoom: 17 }); }}
        >
          <MaterialIcons name="my-location" size={22} color="#344054" />
        </Pressable>
        <Pressable
          accessibilityLabel="Xem toàn bộ lộ trình"
          style={styles.mapControl}
          onPress={() => {
            if (!route || route.coordinates.length < 2) return;
            const lngs = route.coordinates.map(point => point.lng);
            const lats = route.coordinates.map(point => point.lat);
            camera.current?.fitBounds(
              [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
              { padding: { top: 120, bottom: 180, left: 40, right: 40 }, duration: 400 },
            );
          }}
        >
          <MaterialIcons name="alt-route" size={22} color="#344054" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F7', gap: 10, padding: 24 },
  emptyText: { color: '#667085', textAlign: 'center' },
  maneuver: { position: 'absolute', top: 4, left: 14, right: 14, minHeight: 78, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0B5B2A', elevation: 5, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, flexDirection: 'row', alignItems: 'center', gap: 12 },
  maneuverArrow: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  maneuverCopy: { flex: 1, gap: 4 },
  maneuverInstruction: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  maneuverDistance: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  mapControls: { position: 'absolute', right: 14, top: 126, gap: 12 },
  mapControl: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
});
