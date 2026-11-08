import { useCustomerRideCancellation } from '@/lib/useCustomerRideCancellation';
import { translate as i18nT, type RideCoordinates, type RideStatus } from '@datxe/shared';
import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { getBookingRoute } from '@/lib/directions';
import { getCustomerVehicles } from '../api';
import { useRideQuery } from './useRideQuery';
import { useLiveDriverLocation } from './useLiveDriverLocation';

const pickupLeg: RideStatus[] = ['DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'VEHICLE_HANDOVER'];
const dropoffLeg: RideStatus[] = ['IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED'];

function legDestination(
  status: RideStatus | undefined,
  pickup: { lat: number | null; lng: number | null } | undefined,
  dropoff: { lat: number | null; lng: number | null } | undefined,
): RideCoordinates | null {
  const point = status && pickupLeg.includes(status) ? pickup : status && dropoffLeg.includes(status) ? dropoff : null;
  if (point?.lat == null || point.lng == null) return null;
  return { lat: point.lat, lng: point.lng };
}

export function useDriverTracking() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
  const query = useRideQuery(rideId, true);
  const ride = query.data;
  const valid = Number.isSafeInteger(rideId) && rideId > 0;
  const error = !valid ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
  const refresh = query.refetch;
  const cancellation = useCustomerRideCancellation(ride, refresh);
  const live = useLiveDriverLocation(rideId, Boolean(ride && !['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM'].includes(ride.status)), refresh, Boolean(ride?.driverId));
  const vehiclesQuery = useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles,enabled:Boolean(ride?.vehicleId)});
  const vehicle = vehiclesQuery.data?.find(item=>item.id===ride?.vehicleId) ?? null;
  useEffect(() => { if (ride) useSessionStore.getState().setActiveRide(ride); }, [ride]);
  useEffect(() => { if (ride?.status === 'SEARCHING') router.replace({pathname:'/ride/find-driver',params:{rideId:String(ride.id)}}); }, [ride?.id, ride?.status, router]);

  // Route từ vị trí tài xế tới điểm đón (đang đến đón) hoặc điểm trả (đang chạy).
  const driver = live.sample?.location ?? null;
  const destination = legDestination(ride?.status, ride?.pickup, ride?.dropoff);
  const vehicleType = vehicle?.vehicle_type === 'MOTORCYCLE' ? 'MOTORCYCLE' as const
    : vehicle?.vehicle_type === 'CAR' ? 'CAR' as const : undefined;
  const [route, setRoute] = useState<RideCoordinates[]>([]);
  const originKey = driver ? `${driver.lat.toFixed(3)},${driver.lng.toFixed(3)}` : '';
  const destinationKey = destination ? `${destination.lat},${destination.lng}` : '';
  const shownLeg = useRef(destinationKey);
  useEffect(() => {
    if (shownLeg.current !== destinationKey) {
      shownLeg.current = destinationKey;
      setRoute([]);
    }
    if (!driver || !destination || !vehicleType) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void getBookingRoute(driver, destination, vehicleType, controller.signal)
        .then(coordinates => { if (!controller.signal.aborted) setRoute(coordinates); })
        .catch(() => undefined);
    }, 350);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [originKey, destinationKey, vehicleType]);

  const pendingPickup = ride?.handoverReports.find((report) => report.phase === 'PICKUP' && !report.confirmedByCustomer);
  const pendingDropoff = ride?.handoverReports.find((report) => report.phase === 'DROPOFF' && !report.confirmedByCustomer);
  return { router, params, rideId, ride, vehicle, error, cancellation, refresh, pendingPickup, pendingDropoff, live, route };
}
