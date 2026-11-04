import { rideStyles as s } from '@/components/rideStyles';
import { formatMoney } from '@datxe/shared';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccept } from '../hooks/useAccept';
export default function AcceptRideScreen() {
  const h = useAccept();
  const openDirections = () => {
    if (!h.offer?.pickup.lat || !h.offer.pickup.lng) return;
    h.router.push({ pathname: '/ride/directions', params: { lat: String(h.offer.pickup.lat), lng: String(h.offer.pickup.lng), address: h.offer.pickup.address } });
  };
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => h.router.back()}><Text style={s.link}>‹ Quay lại</Text></Pressable><Text style={s.title}>Yêu cầu chuyến đi</Text>
    {h.loading ? <ActivityIndicator /> : null}{h.error ? <Text style={s.error}>{h.error}</Text> : null}
    {h.offer ? <><View style={s.card}><Text style={s.label}>ĐIỂM ĐÓN · {h.offer.customer.displayName}</Text><Text style={s.text}>{h.offer.pickup.address}</Text><Text style={s.label}>GHI CHÚ ĐIỂM ĐÓN</Text><Text style={s.text}>{h.offer.pickupNote || 'Khách chưa thêm ghi chú điểm đón.'}</Text><Pressable onPress={openDirections}><Text style={s.link}>Mở chỉ đường tới điểm đón</Text></Pressable></View>
      <View style={s.card}><Text style={s.label}>ĐIỂM TRẢ</Text><Text style={s.text}>{h.offer.dropoff.address}</Text><Text style={s.text}>{h.offer.tripDistanceKm} km · {h.offer.estDurationMin} phút</Text><Text style={s.text}>{h.offer.vehicle.type} · {h.offer.vehicle.transmission}</Text><Text style={s.title}>{formatMoney(h.offer.fareEstimate)}</Text>{h.offer.note ? <Text style={s.text}>{h.offer.note}</Text> : null}</View>
      <Pressable disabled={h.busy || !h.secondsLeft} onPress={h.accept} style={[s.button, (h.busy || !h.secondsLeft) && { opacity: 0.4 }]}><Text style={s.buttonText}>{h.busy ? 'Đang xử lý…' : h.secondsLeft ? `Nhận chuyến (${h.secondsLeft}s)` : 'Yêu cầu đã hết hạn'}</Text></Pressable><Pressable disabled={h.busy} onPress={h.reject}><Text style={s.link}>Bỏ qua yêu cầu</Text></Pressable></> : !h.loading ? <View style={s.card}><Text style={s.text}>Chưa có yêu cầu chuyến đi đang chờ.</Text><Pressable onPress={() => void h.refresh()}><Text style={s.link}>Tải lại</Text></Pressable></View> : null}
  </ScrollView></SafeAreaView>;
}
