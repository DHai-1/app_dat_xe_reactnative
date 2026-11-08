import { positiveId } from '@datxe/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { customerApi } from './customerApi';
import { useSessionStore } from './store';

type RideKey = { customerId: number; rideId: number };
const terminal = new Set(['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM']);
const liveRidePaths = new Set(['/ride/tracking', '/ride/find-driver', '/vehicle-inspection']);
const detailKey = (id: number | undefined) => ['customer', 'getCustomerRide', id] as const;

export function useRideCompletion(customerId: number | undefined, ready: boolean, pathname: string) {
  const client = useQueryClient();
  const router = useRouter();
  const params = useGlobalSearchParams<{ rideId?: string }>();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [tracked, setTracked] = useState<RideKey | null>(null);
  const [pushed, setPushed] = useState<RideKey | null>(null);
  const displayed = useRef(new Set<string>());
  const sessionRide = useSessionStore(state => state.activeRide);
  const active = useQuery({
    queryKey: ['customer', 'getActiveCustomerRide'],
    queryFn: customerApi.getActiveCustomerRide,
    enabled: ready,
  });
  const current = active.data ?? sessionRide;
  const routeRideId = liveRidePaths.has(pathname)
    ? positiveId(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId)
    : null;
  const activeRideId = current && current.customerId === customerId && !terminal.has(current.status)
    ? current.id : undefined;
  const currentId = routeRideId ?? activeRideId;
  if (customerId && currentId && (tracked?.customerId !== customerId || tracked.rideId !== currentId)) {
    setTracked({ customerId, rideId: currentId });
  }
  const trackedId = currentId ?? (tracked?.customerId === customerId ? tracked?.rideId : undefined);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => listener.remove();
  }, []);

  // The active endpoint stops returning a ride when it completes. Keep polling its ID.
  const detail = useQuery({
    queryKey: detailKey(trackedId),
    queryFn: () => customerApi.getCustomerRide(trackedId!),
    enabled: ready && trackedId !== undefined,
    staleTime: 0,
    refetchInterval: query => {
      const ride = query.state.data;
      if (terminal.has(ride?.status ?? '')) return false;
      return ride?.type === 'SCHEDULED' && ride.status === 'PENDING' ? 30000 : 5000;
    },
  });
  const completedId = detail.data?.customerId === customerId && detail.data?.status === 'COMPLETED'
    ? detail.data.id : undefined;
  const pushedId = pushed?.customerId === customerId ? pushed?.rideId : undefined;

  useEffect(() => {
    if (!ready || !foreground || AppState.currentState !== 'active' || !customerId) return;
    const rideId = [pushedId, completedId].find(id => id && !displayed.current.has(`${customerId}:${id}`));
    if (!rideId) return;
    displayed.current.add(`${customerId}:${rideId}`);
    if (pathname === '/ride/completed' && Number(params.rideId) === rideId) return;
    const destination = { pathname: '/ride/completed' as const, params: { rideId: String(rideId) } };
    if (liveRidePaths.has(pathname)) {
      router.replace(destination);
    } else {
      router.navigate(destination);
    }
  }, [completedId, customerId, foreground, params.rideId, pathname, pushedId, ready, router]);

  return useCallback(async (id: number, recipientId: number) => {
    const ride = await client.fetchQuery({
      queryKey: detailKey(id),
      queryFn: () => customerApi.getCustomerRide(id),
      staleTime: 0,
    });
    if (ride.status === 'COMPLETED' && ride.customerId === recipientId &&
        useSessionStore.getState().user?.id === recipientId) {
      setPushed({ customerId: recipientId, rideId: id });
    }
  }, [client]);
}
