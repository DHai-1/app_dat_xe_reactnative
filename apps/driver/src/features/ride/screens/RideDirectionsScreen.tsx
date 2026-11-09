import { DriverDirectionsMap } from '@/components/DriverDirectionsMap';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRideDirections } from '../hooks/useRideDirections';

export default function RideDirectionsScreen() {
  const h = useRideDirections();
  const isDropoff = h.stop === 'dropoff';
  const targetLabel = isDropoff ? 'điểm trả' : 'điểm đón';
  const title = isDropoff ? 'Chỉ đường đến điểm trả' : 'Chỉ đường đến điểm đón';
  const goBack = () => (h.router.canGoBack() ? h.router.back() : h.router.replace('/ride/in-progress'));

  if (!h.destination) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>{h.error || 'Chuyến chưa có tọa độ điểm đến.'}</Text>
        <Pressable onPress={goBack}><Text style={styles.link}>Quay lại</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityLabel="Quay lại"><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.address}>{h.address || title}</Text>
        </View>
      </View>
      <View style={styles.map}>
        <DriverDirectionsMap destination={h.destination} targetLabel={targetLabel} directions={h.directions} onRefresh={h.refresh} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', gap: 12 },
  back: { fontSize: 32, lineHeight: 32, color: '#101828' },
  headerCopy: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#101828' },
  address: { marginTop: 2, color: '#667085', fontSize: 12 },
  map: { flex: 1, overflow: 'hidden' },
  error: { margin: 24, color: '#B42318' },
  link: { marginHorizontal: 24, color: '#B42318', fontWeight: '600' },
});
