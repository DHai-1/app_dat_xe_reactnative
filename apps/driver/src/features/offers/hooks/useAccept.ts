import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { dismissOfferNotifications } from '@datxe/shared';
import { useEffect, useState } from 'react';
import { acceptDriverOffer, getPendingOffer, rejectDriverOffer } from '../api';
export function useAccept() {
  const router = useRouter(); const client = useQueryClient();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const expectedId = rideId === undefined ? null : Number(rideId);
  const query = useQuery({ queryKey: ['driver', 'pendingOffer'], queryFn: getPendingOffer, staleTime: 0, refetchOnMount: 'always' });
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const offer = expectedId === null || query.data?.rideId === expectedId ? query.data : null;
  const mismatch = Boolean(expectedId !== null && query.isSuccess && !offer);
  const secondsLeft = offer ? Math.max(0, Math.ceil((offer.expiresAt - now) / 1000)) : 0;
  const dismiss = () => { if (offer) void dismissOfferNotifications(offer.rideId).catch(() => {}); };
  const accept = useMutation({ mutationFn: async () => { if (!offer || offer.expiresAt <= Date.now()) throw new Error('Yêu cầu đã hết hạn.'); return acceptDriverOffer(offer.rideId); }, onSuccess: async () => { dismiss(); await client.invalidateQueries({ queryKey: ['driver'] }); router.replace('/ride/in-progress'); } });
  const reject = useMutation({ mutationFn: async () => { if (offer) await rejectDriverOffer(offer.rideId); }, onSuccess: async () => { dismiss(); await client.invalidateQueries({ queryKey: ['driver'] }); if (router.canGoBack()) router.back(); else router.replace('/(tabs)/home'); } });
  return { router, offer, secondsLeft, loading: query.isLoading, error: query.error?.message || accept.error?.message || reject.error?.message || (mismatch ? 'Yêu cầu chuyến này đã hết hạn hoặc không còn khả dụng.' : ''), busy: accept.isPending || reject.isPending, accept: () => accept.mutate(), reject: () => reject.mutate(), refresh: query.refetch };
}
