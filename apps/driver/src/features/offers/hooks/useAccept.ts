import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { acceptDriverOffer, getPendingOffer, rejectDriverOffer } from '../api';
export function useAccept() {
  const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'pendingOffer'], queryFn: getPendingOffer });
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const offer = query.data;
  const secondsLeft = offer ? Math.max(0, Math.ceil((offer.expiresAt - now) / 1000)) : 0;
  const accept = useMutation({ mutationFn: async () => { if (!offer || !secondsLeft) throw new Error('Yêu cầu đã hết hạn.'); return acceptDriverOffer(offer.rideId); }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); router.replace('/ride/in-progress'); } });
  const reject = useMutation({ mutationFn: async () => { if (offer) await rejectDriverOffer(offer.rideId); }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); router.back(); } });
  return { router, offer, secondsLeft, loading: query.isLoading, error: query.error?.message || accept.error?.message || reject.error?.message, busy: accept.isPending || reject.isPending, accept: () => accept.mutate(), reject: () => reject.mutate(), refresh: query.refetch };
}
