import type { RideStatus } from '@datxe/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getDriverActiveRide, getDriverRide, progressDriverRide } from '../api';
const actions: Partial<Record<RideStatus, [string, string]>> = { DRIVER_ASSIGNED: ['Đi đón khách', 'start-arriving'], DRIVER_ARRIVING: ['Đã tới điểm đón', 'arrived'], VEHICLE_HANDOVER: ['Bắt đầu chuyến đi', 'start'], IN_PROGRESS: ['Đã tới điểm trả', 'arrive-destination'], VEHICLE_RETURNED: ['Hoàn tất chuyến', 'complete'] };
export function useInProgress() {
  const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide, refetchInterval: 3000 });
  const [lastRideId, setLastRideId] = useState<number | null>(null);
  useEffect(() => {
    if (query.data?.id) {
      // Keep the last ride available briefly after /active becomes empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastRideId(query.data.id);
    }
  }, [query.data?.id]);
  // After the customer cancels, /active no longer returns the ride. Re-read the
  // last ride briefly so the driver sees the cancellation instead of a blank screen.
  const endedRide = useQuery({
    queryKey: ['driver', 'rideAfterActive', lastRideId],
    queryFn: () => getDriverRide(lastRideId as number),
    enabled: Boolean(lastRideId) && !query.data,
    refetchInterval: query.data ? false : 3000,
  });
  const ride = query.data ?? (endedRide.data?.status === 'CANCELLED' ? endedRide.data : null);
  const waitingForCustomer = Boolean(ride && ((ride.status === 'VEHICLE_HANDOVER' && !ride.handoverReports.find(report => report.phase === 'PICKUP')?.confirmedByCustomer) || (ride.status === 'VEHICLE_RETURNED' && !ride.handoverReports.find(report => report.phase === 'DROPOFF')?.confirmedByCustomer)));
  const action = ride && !waitingForCustomer ? actions[ride.status] : undefined;
  const progress = useMutation({ mutationFn: async () => { if (ride && action) await progressDriverRide(ride.id, action[1]); }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); if (ride && action?.[1] === 'complete') router.replace({pathname:'/ride/complete',params:{rideId:String(ride.id)}}); } });
  const isDropoff = Boolean(ride && ['IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED', 'COMPLETED'].includes(ride.status));
  return { router, client, query, ride, action, progress, isDropoff, waitingForCustomer, endedRide };
}
