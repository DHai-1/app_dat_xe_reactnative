import { rideStyles as s } from '@/components/rideStyles';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { getDriverActiveRide } from '../api';
export function PickupNoteCard() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide });
  const ride = query.data;
  if (!ride) return null;
  return <View style={s.card}><Text style={s.label}>ĐIỂM ĐÓN · #{ride.id}</Text><Text style={s.text}>{ride.pickupAddress}</Text><Text style={s.label}>GHI CHÚ ĐIỂM ĐÓN</Text><Text style={s.text}>{ride.pickupNote || 'Khách chưa thêm ghi chú điểm đón.'}</Text><Pressable onPress={() => { if (ride.pickup.lat !== null && ride.pickup.lng !== null) router.push({ pathname: '/ride/directions', params: { lat: String(ride.pickup.lat), lng: String(ride.pickup.lng), address: ride.pickupAddress } }); }}><Text style={s.link}>Mở chỉ đường tới điểm đón</Text></Pressable></View>;
}
