import { useDriverCredit } from '@/lib/useDriverCredit';
import { usePendingOffer } from '@/lib/driverOffer';
import { driverApi } from '@/lib/driverApi';
import { useSessionStore } from '@/lib/store';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getHomeDailySummary,getHomeActiveRide,getHomeSession,getHomeVerification,setDriverAvailability } from '../api';
export function useHome() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useQuery({ queryKey: ['driver', 'session'], queryFn: getHomeSession });
  const verification = useQuery({ queryKey: ['driver', 'verification'], queryFn: getHomeVerification });
  const active = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getHomeActiveRide });
  const summary = useQuery({ queryKey: ['driver', 'dailySummary'], queryFn: getHomeDailySummary, refetchInterval: 60000 });
  useRefreshOnFocus(summary.refetch);
  const credit = useDriverCredit();
  const offer = usePendingOffer(credit.allowed);
  const skills = useQuery({ queryKey: ['driver', 'skills'], queryFn: driverApi.skills });
  const documents = useQuery({ queryKey: ['driver', 'documents'], queryFn: driverApi.documents });
  useRefreshOnFocus(session.refetch);
  useRefreshOnFocus(verification.refetch);
  useRefreshOnFocus(active.refetch);
  useRefreshOnFocus(offer.refetch);
  useRefreshOnFocus(skills.refetch);
  useRefreshOnFocus(documents.refetch);
  const availability = useMutation({
    mutationFn: async (body: Parameters<typeof setDriverAvailability>[0]) => {
      if (body.online) {
        const result = await credit.refetch();
        if (result.error || !result.data?.canReceive) throw new Error(result.error?.message || 'Số dư ví tín dụng không đủ để nhận chuyến.');
      }
      return setDriverAvailability(body);
    },
    onSuccess: async result => {
      const user = useSessionStore.getState().user;
      if (user && result) useSessionStore.getState().setUser({ ...user, status: result.status });
      await client.invalidateQueries({ queryKey: ['driver'] });
    },
  });
  return { router, credit, summary, session, verification, active, offer, skills, documents, availability };
}
