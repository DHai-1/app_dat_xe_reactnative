import { DriverDirectionsMap } from '@/components/DriverDirectionsMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DriverDirectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; address?: string }>();
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (!valid) return <SafeAreaView style={styles.safe}><Text style={styles.error}>Điểm đón chưa có tọa độ hợp lệ.</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Quay lại</Text></Pressable></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.title}>Chỉ đường tới điểm đón</Text><Text numberOfLines={1} style={styles.address}>{params.address || 'Điểm đón khách'}</Text></View></View>
    <View style={styles.map}><DriverDirectionsMap destination={{ lat, lng }} /></View>
    <View style={styles.footer}><Text style={styles.footerLabel}>ĐIỂM ĐÓN</Text><Text style={styles.footerAddress}>{params.address || 'Điểm đón khách'}</Text><Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>Đã xem điểm đón</Text></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F2F4F7' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', gap: 12 }, back: { fontSize: 32, lineHeight: 32, color: '#101828' }, headerCopy: { flex: 1 }, title: { fontSize: 18, fontWeight: '700', color: '#101828' }, address: { marginTop: 2, color: '#667085', fontSize: 12 }, map: { flex: 1, overflow: 'hidden' }, footer: { padding: 18, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 8 }, footerLabel: { color: '#B42318', fontSize: 11, fontWeight: '700' }, footerAddress: { color: '#344054', fontSize: 15 }, button: { marginTop: 8, backgroundColor: '#B42318', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }, buttonText: { color: '#FFFFFF', fontWeight: '700' }, error: { margin: 24, color: '#B42318' }, link: { marginHorizontal: 24, color: '#B42318', fontWeight: '600' } });
