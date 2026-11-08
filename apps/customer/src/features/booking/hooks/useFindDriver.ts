import { env } from '@/config/env';
import { useCustomerRideCancellation } from '@/lib/useCustomerRideCancellation';
import { createStompClient, parsePushData, positiveId, record, stompBrokerUrl, translate as i18nT } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useRef } from 'react';
import { getActiveCustomerRide,getCustomerRide } from '../api';
export function useFindDriver() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useQuery({queryKey:['customer','findDriver',rideId],queryFn:()=>rideId?getCustomerRide(rideId):getActiveCustomerRide(),staleTime:0,refetchInterval:query=>{
  const ride=query.state.data;
  if(ride && !['PENDING','SEARCHING'].includes(ride.status)) return false;
  return ride?.type==='SCHEDULED' && ride.status==='PENDING' ? 30000 : 4000;
}});
const ride=query.data;
const error=query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đang hoạt động trong tài khoản.") : '');
const moved=useRef(false);
const refresh = query.refetch;
const searchingRideId = ride && ['PENDING', 'SEARCHING'].includes(ride.status) ? ride.id : undefined;
useEffect(() => {
  if (!searchingRideId) return;
  const socket = createStompClient(stompBrokerUrl(env.apiUrl), 'CUSTOMER');
  const unsubscribe = socket.subscribe('/user/queue/trip', message => {
    const event = parsePushData({ payload: message.body });
    if (event && positiveId(record(event.payload).rideId) === searchingRideId) {
      void refresh({ cancelRefetch: false });
    }
  });
  const stopConnection = socket.onConnection(connected => {
    if (connected) void refresh({ cancelRefetch: false });
  });
  socket.connect();
  return () => { unsubscribe(); stopConnection(); void socket.disconnect(); };
}, [searchingRideId, refresh]);
const cancellation = useCustomerRideCancellation(ride, refresh, { cancelSearchingImmediately: true });
useEffect(()=>{
 if(!ride || moved.current || cancellation.visible || cancellation.busy)return;
 if(['DRIVER_ASSIGNED','DRIVER_ARRIVING','DRIVER_ARRIVED','VEHICLE_HANDOVER','IN_PROGRESS','ARRIVED_DESTINATION','VEHICLE_RETURNED'].includes(ride.status)) {
  moved.current=true;router.replace({pathname:'/ride/tracking',params:{rideId:String(ride.id)}});
 }
},[ride,router,cancellation.visible,cancellation.busy]);
return { router, ride, error, cancellation, refresh };
}
