import { DriverDirectionsMap } from '@/components/DriverDirectionsMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DriverDirectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; address?: string; target?: string }>();
  const isDropoff = params.target === 'dropoff';
  const targetLabel = isDropoff ? 'điểm trả' : 'điểm đón';
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (!valid) return <SafeAreaView style={styles.safe}><Text style={styles.error}>Tọa độ {targetLabel} chưa hợp lệ.</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Quay lại</Text></Pressable></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.title}>Chỉ đường tới {targetLabel}</Text><Text numberOfLines={1} style={styles.address}>{params.address || (isDropoff ? 'Điểm trả khách' : 'Điểm đón khách')}</Text></View></View>
    <View style={styles.map}><DriverDirectionsMap destination={{ lat, lng }} targetLabel={targetLabel} /></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F2F4F7' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', gap: 12 }, back: { fontSize: 32, lineHeight: 32, color: '#101828' }, headerCopy: { flex: 1 }, title: { fontSize: 18, fontWeight: '700', color: '#101828' }, address: { marginTop: 2, color: '#667085', fontSize: 12 }, map: { flex: 1, overflow: 'hidden' }, error: { margin: 24, color: '#B42318' }, link: { marginHorizontal: 24, color: '#B42318', fontWeight: '600' } });
