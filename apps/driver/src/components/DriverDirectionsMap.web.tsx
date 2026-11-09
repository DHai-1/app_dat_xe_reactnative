import type { RideCoordinates } from '@datxe/shared';
import { StyleSheet, Text, View } from 'react-native';

export function DriverDirectionsMap({ destination }: { destination: RideCoordinates }) {
  return <View style={styles.empty}><Text style={styles.title}>Bản đồ chỉ đường</Text><Text style={styles.text}>Điểm đón: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}</Text><Text style={styles.text}>Bản đồ nội bộ chỉ khả dụng trên Android/iOS.</Text></View>;
}
const styles = StyleSheet.create({ empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: '#F2F4F7' }, title: { fontSize: 18, fontWeight: '700' }, text: { color: '#667085', textAlign: 'center' } });
