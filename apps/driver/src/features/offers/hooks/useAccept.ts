import { useDriverCredit } from '@/lib/useDriverCredit';
import { pendingOfferKey, usePendingOffer, type DriverOffer } from '@/lib/driverOffer';
import { offerRemainingMs } from '@/lib/offerTiming';
import { useSessionStore } from '@/lib/store';
import { dismissOfferNotifications } from '@datxe/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { acceptDriverOffer, rejectDriverOffer } from '../api';

export function useAccept() {
  const router = useRouter();
  const client = useQueryClient();
  const driverId = useSessionStore(state => state.user?.id);
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const expectedId = rideId === undefined ? null : Number(rideId);
  const credit = useDriverCredit();
  const query = usePendingOffer(credit.allowed);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const offer = expectedId === null || query.data?.rideId === expectedId ? query.data : null;
  const mismatch = expectedId !== null && query.isSuccess && !offer;
  const expiresAt = offer ? query.dataUpdatedAt + offerRemainingMs(offer, query.dataUpdatedAt, query.dataUpdatedAt) : 0;
  const secondsLeft = offer ? Math.ceil(offerRemainingMs(offer, query.dataUpdatedAt, now) / 1000) : 0;

  const offerKey = [...pendingOfferKey, driverId] as const;
  const clearOffer = (closed: DriverOffer) => {
    void dismissOfferNotifications(closed.rideId).catch(() => {});
    client.setQueryData<DriverOffer | null>(offerKey, current =>
      current?.offerId === closed.offerId ? null : current);
    void client.invalidateQueries({ queryKey: pendingOfferKey });
  };
  const accept = useMutation({
    mutationFn: async (pending: DriverOffer) => {
      if (offerRemainingMs(pending, query.dataUpdatedAt, Date.now()) <= 0) {
        throw new Error('Yêu cầu đã hết hạn.');
      }
      const balance = await credit.refetch();
      if (balance.error || !balance.data?.canReceive) throw new Error(balance.error?.message || 'Số dư ví tín dụng không đủ để nhận chuyến.');
      await acceptDriverOffer(pending.rideId, pending.offerId);
    },
    onSuccess: (_, accepted) => {
      clearOffer(accepted);
      void client.invalidateQueries({ queryKey: ['driver', 'activeRide'] });
      void client.invalidateQueries({ queryKey: ['driver', 'session'] });
      router.replace('/ride/in-progress');
    },
  });
  const reject = useMutation({
    mutationFn: (pending: DriverOffer) => rejectDriverOffer(pending.rideId, pending.offerId),
    onSuccess: (_, rejected) => {
      clearOffer(rejected);
      if (client.getQueryData<DriverOffer | null>(offerKey)) return;
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/home');
    },
  });

  return {
    router, credit, offer, expiresAt, secondsLeft, loading: query.isLoading || credit.isLoading,
    error: query.error?.message || accept.error?.message || reject.error?.message ||
      (mismatch ? 'Yêu cầu chuyến này đã hết hạn hoặc không còn khả dụng.' : ''),
    busy: accept.isPending || reject.isPending,
    accept: () => { if (offer && !accept.isPending && !reject.isPending) accept.mutate(offer); },
    reject: () => { if (offer && !accept.isPending && !reject.isPending && offerRemainingMs(offer, query.dataUpdatedAt, Date.now()) > 0) reject.mutate(offer); },
    refresh: query.refetch,
  };
}
