import { rideStyles as s } from '@/components/rideStyles';
import { formatMoney } from '@datxe/shared';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInProgress } from '../hooks/useInProgress';
export default function InProgressRideScreen() {
  const { router, client, query, ride, action, progress, isDropoff, waitingForCustomer, endedRide } = useInProgress();
  const openDirections = (point: { lat: number | null; lng: number | null }, address: string | null) => {
    if (point.lat === null || point.lng === null) return;
    router.push({ pathname: '/ride/directions', params: { lat: String(point.lat), lng: String(point.lng), address: address || '' } });
  };
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><Pressable onPress={() => router.back()}><Text style={s.link}>‹ Quay lại</Text></Pressable><Text style={s.title}>Chuyến đang thực hiện</Text>
    {query.isLoading || endedRide.isFetching ? <ActivityIndicator /> : null}{query.error || endedRide.error || progress.error ? <Text style={s.error}>{query.error?.message || endedRide.error?.message || progress.error?.message}</Text> : null}
    {ride?.status === 'CANCELLED' ? <View style={s.card}><Text style={s.title}>Khách hàng đã hủy chuyến</Text><Text style={s.text}>Chuyến #{ride.id} đã được hủy khi bạn đang đến điểm đón.</Text><Text style={s.error}>{ride.cancelReason || 'Khách hàng đã hủy chuyến.'}</Text><Pressable onPress={() => { void client.invalidateQueries({ queryKey: ['driver'] }); router.replace('/(tabs)/home'); }} style={s.button}><Text style={s.buttonText}>Tiếp tục nhận chuyến</Text></Pressable></View> : ride ? <><Text style={s.label}>#{ride.id} · {ride.status}</Text><View style={s.card}><Text style={s.label}>ĐIỂM ĐÓN</Text><Text style={s.text}>{ride.pickupAddress}</Text><Text style={s.label}>GHI CHÚ ĐIỂM ĐÓN</Text><Text style={s.text}>{ride.pickupNote || 'Khách chưa thêm ghi chú điểm đón.'}</Text></View><View style={s.card}><Text style={s.label}>ĐIỂM TRẢ</Text><Text style={s.text}>{ride.dropoffAddress}</Text>{ride.route ? <Text style={s.text}>{(ride.route.distanceMeters / 1000).toFixed(2)} km · {Math.ceil(ride.route.durationSeconds / 60)} phút</Text> : null}<Text style={s.title}>{formatMoney(ride.estimatedFare)}</Text></View>
      <Pressable onPress={() => openDirections(isDropoff ? ride.dropoff : ride.pickup, isDropoff ? ride.dropoffAddress : ride.pickupAddress)} style={s.button}><Text style={s.buttonText}>Mở chỉ đường tới {isDropoff ? 'điểm trả' : 'điểm đón'}</Text></Pressable>
      {action ? <Pressable disabled={progress.isPending} onPress={() => progress.mutate()} style={s.button}><Text style={s.buttonText}>{progress.isPending ? 'Đang cập nhật…' : action[0]}</Text></Pressable> : null}
      {waitingForCustomer ? <Text style={s.text}>Đang chờ khách kiểm tra và xác nhận biên bản trước khi tiếp tục.</Text> : null}
      <Pressable onPress={() => router.push('/ride/vehicle-inspection')}><Text style={s.link}>Xem biên bản bàn giao / hoàn trả</Text></Pressable><Pressable onPress={() => void query.refetch()}><Text style={s.link}>Làm mới trạng thái chuyến</Text></Pressable></> : !query.isLoading ? <Text style={s.text}>Bạn chưa có chuyến đang hoạt động.</Text> : null}
  </ScrollView></SafeAreaView>;
}
