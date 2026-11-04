import { driverApi } from '@/lib/driverApi';
import { useSessionStore } from '@/lib/store';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getHomeActiveRide,getHomeSession,getHomeVerification,getPendingOffer,setDriverAvailability } from '../api';
export function useHome() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useQuery({ queryKey: ['driver', 'session'], queryFn: getHomeSession });
  const verification = useQuery({ queryKey: ['driver', 'verification'], queryFn: getHomeVerification });
  const active = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getHomeActiveRide });
  const online = session.data?.status === 'ONLINE';
  // Dự phòng khi lỡ frame STOMP/FCM: vẫn thấy offer trong 15 giây.
  const offer = useQuery({ queryKey: ['driver', 'pendingOffer'], queryFn: getPendingOffer, refetchInterval: online ? 3000 : false });
  const skills = useQuery({ queryKey: ['driver', 'skills'], queryFn: driverApi.skills });
  const documents = useQuery({ queryKey: ['driver', 'documents'], queryFn: driverApi.documents });
  useRefreshOnFocus(session.refetch);
  useRefreshOnFocus(verification.refetch);
  useRefreshOnFocus(active.refetch);
  useRefreshOnFocus(offer.refetch);
  useRefreshOnFocus(skills.refetch);
  useRefreshOnFocus(documents.refetch);
  useEffect(() => {
    if (session.data) useSessionStore.getState().setUser(session.data);
  }, [session.data]);
  const availability = useMutation({
    mutationFn: setDriverAvailability,
    onSuccess: async result => {
      const user = useSessionStore.getState().user;
      if (user && result) useSessionStore.getState().setUser({ ...user, status: result.status });
      await client.invalidateQueries({ queryKey: ['driver'] });
    },
  });
  return { router, session, verification, active, offer, skills, documents, availability };
}
