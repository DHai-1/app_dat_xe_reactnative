import { env } from '@/config/env';
import type { RideCoordinates } from '@datxe/shared';
import Navigation, { NAVIGATION_MAP_VIEW_IMPL, NavigationViewport, type Route } from '@rnmapbox/navigation';
import Mapbox, { MapView } from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type Props = { destination: RideCoordinates; targetLabel?: string };

export function DriverDirectionsMap({ destination, targetLabel = 'điểm đón' }: Props) {
  const [current, setCurrent] = useState<RideCoordinates | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [instruction, setInstruction] = useState('');
  const [secondaryInstruction, setSecondaryInstruction] = useState('');
  const [secondaryRoad, setSecondaryRoad] = useState('');
  const [maneuverRoad, setManeuverRoad] = useState('');
  const [roadShield, setRoadShield] = useState('');
  const [stepDistance, setStepDistance] = useState(0);
  const [maneuverArrow, setManeuverArrow] = useState('↑');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speedLimit, setSpeedLimit] = useState<number | null>(60);

  useEffect(() => {
    let active = true;
    const token = env.mapboxToken?.trim();
    if (token) {
      void Mapbox.setAccessToken(token);
      Navigation.setAccessToken(token);
    }
    void Location.requestForegroundPermissionsAsync().then(permission => {
      if (!permission.granted) return;
      return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    }).then(position => {
      if (active && position) setCurrent({ lat: position.coords.latitude, lng: position.coords.longitude });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    const waypoints = [
      [current.lng, current.lat] as [number, number],
      { coordinate: [destination.lng, destination.lat] as [number, number], name: `Điểm ${targetLabel} khách` },
    ];
    void Navigation.requestRoutes({
      waypoints,
      profile: 'driving-traffic',
      language: 'vi',
      units: 'metric',
    }).then(response => {
      response.alternatives.forEach(alternative => alternative.release());
      if (cancelled) {
        response.main.release();
        return;
      }
      setRoute(previous => {
        previous?.release();
        return response.main;
      });
      setInstruction(`Đang đi tới ${targetLabel}`);
    }).catch(error => {
      if (!cancelled) console.warn('Mapbox Navigation route:', error);
    });
    return () => { cancelled = true; };
  }, [current, destination.lat, destination.lng, targetLabel]);

  useEffect(() => {
    Navigation.setVoiceMuted(true);
    const subscription = Navigation.addVoiceInstructionListener(instruction => {
      void Speech.stop();
      Speech.speak(localizeInstruction(instruction.text), {
        language: 'vi-VN',
        rate: 0.92,
        pitch: 1,
      });
    });
    return () => {
      subscription.remove();
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (!route) return;
    void Navigation.startActiveGuidance(route).catch(error => {
      console.warn('Mapbox Navigation guidance:', error);
    });
    return () => {
      Navigation.stopNavigation();
    };
  }, [route]);

  useEffect(() => {
    const subscription = Navigation.addRouteProgressListener(progress => {
      const modifier = progress.maneuverModifier.toLowerCase();
      setManeuverArrow(
        modifier.includes('left') ? '←' : modifier.includes('right') ? '→' : '↑',
      );
      setInstruction(
        progress.maneuverInstruction ||
          (progress.maneuverType === 'straight' ? 'Đi thẳng' : progress.secondaryInstruction) ||
          `Đang đi tới ${targetLabel}`,
      );
      const road = roadFromComponents(progress.maneuverComponents);
      const roadDetails = roadDetailsFromComponents(progress.maneuverComponents);
      setRoadShield(roadDetails.shield);
      setManeuverRoad(roadDetails.name || road || localizeInstruction(progress.maneuverInstruction || ''));
      setSecondaryInstruction(progress.secondaryInstruction || progress.subInstruction || '');
      setSecondaryRoad(roadFromComponents(progress.secondaryComponents));
      setStepDistance(progress.stepDistanceRemaining);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Navigation.addLocationListener(location => {
      const value = location.speedLimit?.speed;
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) setSpeedLimit(Math.round(value));
    });
    return () => subscription.remove();
  }, []);

  if (!current || !route) return <View style={styles.empty}><ActivityIndicator color="#B42318" /><Text style={styles.emptyText}>{current ? 'Đang tính đường…' : 'Đang lấy vị trí hiện tại…'}</Text></View>;
  const displayInstruction = instruction || `Đang đi tới ${targetLabel}`;
  return <View style={StyleSheet.absoluteFill}>
    <MapView style={StyleSheet.absoluteFill} mapViewImpl={NAVIGATION_MAP_VIEW_IMPL} styleURL={env.goongStyleUrl ?? "mapbox://styles/mapbox/streets-v12"}>
      <Mapbox.UserLocation
        visible
        androidRenderMode="normal"
        minDisplacement={1}
        showsUserHeadingIndicator={false}
      />
      <NavigationViewport
        padding={{ top: 88, bottom: 150, left: 24, right: 24 }}
        routeLineStyle={{ color: '#B42318', casingColor: '#FFFFFF', traveledColor: 'rgba(180, 35, 24, 0.35)' }}
      />
    </MapView>
    <View style={styles.maneuver}>
      <View style={styles.maneuverRow}>
        <Text style={styles.maneuverArrow}>{maneuverArrow}</Text>
        {roadShield ? <View style={styles.roadShield}><Text style={styles.roadShieldText}>{roadShield}</Text></View> : null}
        {roadShield && (maneuverRoad || displayInstruction) ? <Text style={styles.roadSeparator}>/</Text> : null}
        <Text style={styles.maneuverRoad}>{maneuverRoad || localizeInstruction(displayInstruction)}</Text>
      </View>
      <Text style={styles.maneuverDistance}>{formatDistance(stepDistance)}</Text>
      <View style={styles.maneuverDivider} />
      <Text style={styles.maneuverSecondary}>{withThen(secondaryRoad || secondaryInstruction || maneuverRoad || displayInstruction)}</Text>
    </View>
    {speedLimit !== null ? <View style={styles.speedLimit}><Text style={styles.speedLimitText}>{speedLimit}</Text></View> : null}
    <View style={styles.mapControls}>
      <Pressable style={styles.mapControl} onPress={() => { const next = !voiceMuted; setVoiceMuted(next); Navigation.setVoiceMuted(next); if (next) void Speech.stop(); }}>
        <MaterialIcons name={voiceMuted ? 'volume-off' : 'volume-up'} size={22} color="#344054" />
      </Pressable>
      <Pressable style={styles.mapControl} onPress={() => Navigation.setCameraState('following')}>
        <MaterialIcons name="my-location" size={22} color="#344054" />
      </Pressable>
      <Pressable style={styles.mapControl} onPress={() => Navigation.setCameraState('overview')}>
        <MaterialIcons name="alt-route" size={22} color="#344054" />
      </Pressable>
    </View>
  </View>;
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function localizeInstruction(value: string): string {
  return value
    .replace(/^Then\s+/i, 'Sau đó ')
    .replace(/^Turn right onto\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left onto\s+/i, 'Rẽ trái vào ')
    .replace(/^Turn right on\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left on\s+/i, 'Rẽ trái vào ')
    .replace(/^Continue straight onto\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight on\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight\s*$/i, 'Đi thẳng')
    .replace(/^Make a U-turn onto\s+/i, 'Quay đầu vào ')
    .replace(/^Make a U-turn on\s+/i, 'Quay đầu vào ')
    .replace(/\bonto\b/gi, 'vào')
    .replace(/\bon the right\b/gi, 'bên phải')
    .replace(/\bon the left\b/gi, 'bên trái');
}

function withThen(value: string): string {
  const localized = localizeInstruction(value);
  return localized.toLowerCase().startsWith('sau đó ') ? localized : `Sau đó ${localized}`;
}

function roadFromComponents(components: ReadonlyArray<{ type: string; text: string }>): string {
  return components
    .filter(component => component.type !== 'delimiter' && component.text.trim())
    .map(component => component.text.trim())
    .filter((text, index, values) => values.indexOf(text) === index)
    .join(' / ');
}

function roadDetailsFromComponents(components: ReadonlyArray<{ type: string; text: string }>) {
  return {
    shield: components.find(component => component.type === 'icon' && component.text.trim())?.text.trim() || '',
    name: components
      .filter(component => component.type === 'text' && component.text.trim())
      .map(component => component.text.trim())
      .filter((text, index, values) => values.indexOf(text) === index)
      .join(' / '),
  };
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F7', gap: 10 },
  emptyText: { color: '#667085' },
  maneuver: { position: 'absolute', top: 4, left: 14, right: 14, minHeight: 78, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0B5B2A', elevation: 5, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  maneuverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  maneuverArrow: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  roadShield: { minWidth: 42, height: 27, paddingHorizontal: 6, borderRadius: 3, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  roadShieldText: { color: '#101828', fontSize: 14, fontWeight: '800' },
  roadSeparator: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: -5 },
  maneuverRoad: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  maneuverDistance: { marginTop: 7, color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  maneuverDivider: { height: 1, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.35)' },
  maneuverSecondary: { marginTop: 7, color: '#FFFFFF', fontSize: 13 },
  mapControls: { position: 'absolute', right: 14, top: 126, gap: 12 },
  mapControl: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  speedLimit: { position: 'absolute', left: 14, top: 126, width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF', borderWidth: 5, borderColor: '#D92D20', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  speedLimitText: { color: '#101828', fontSize: 20, fontWeight: '800' },
});
