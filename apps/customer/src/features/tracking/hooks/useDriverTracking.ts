import { localizedAlert } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { cancelCustomerRide,getCustomerVehicles } from '../api';
import { useRideQuery } from './useRideQuery';
import { useLiveDriverLocation } from './useLiveDriverLocation';
export function useDriverTracking() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
// Keep polling while the tracking screen is open so handover reports still
// reach the customer when the realtime connection is temporarily unavailable.
const query = useRideQuery(rideId, true);
const ride = query.data;
const error = !rideId ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? '';
const [cancelling, setCancelling] = useState(false);
const refresh = query.refetch;
const live = useLiveDriverLocation(rideId, Boolean(ride && !['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED'].includes(ride.status)), refresh, Boolean(ride?.driverId));
const vehiclesQuery = useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles,enabled:Boolean(ride?.vehicleId)});
const vehicle = vehiclesQuery.data?.find(item=>item.id===ride?.vehicleId) ?? null;
useEffect(() => { if (ride) useSessionStore.getState().setActiveRide(ride); }, [ride]);
useEffect(() => { if (ride?.status === 'COMPLETED') router.replace({pathname:'/ride/completed',params:{rideId:String(ride.id)}}); }, [ride?.id, ride?.status, router]);
const pendingPickup = ride?.handoverReports.find((report) => report.phase === 'PICKUP' && !report.confirmedByCustomer);
const pendingDropoff = ride?.handoverReports.find((report) => report.phase === 'DROPOFF' && !report.confirmedByCustomer);
const cancel = () => localizedAlert(i18nT("Hủy chuyến"), i18nT("Bạn có muốn hủy chuyến này?"), [
    { text: 'Đóng', style: 'cancel' },
    { text: 'Hủy chuyến', style: 'destructive', onPress: () => { void (async () => {
      if (!ride || cancelling) return;
      setCancelling(true);
      try { await cancelCustomerRide(ride.id, i18nT("Khách hàng hủy chuyến")); router.replace('/(tabs)/home'); }
      catch (err) { localizedAlert(i18nT("Không thể hủy chuyến"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại.")); }
      finally { setCancelling(false); }
    })(); } },
  ]);
return { router, params, rideId, ride, vehicle, error, cancelling, refresh, pendingPickup, pendingDropoff, cancel, live };
}
