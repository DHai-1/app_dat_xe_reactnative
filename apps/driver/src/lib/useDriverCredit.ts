import { useQuery } from '@tanstack/react-query';
import { driverApi } from './driverApi';
import { useSessionStore } from './store';

export function useDriverCredit() {
  const userId = useSessionStore(state => state.user?.id);
  const query = useQuery({
    queryKey: ['driver', 'creditStatus', userId], queryFn: driverApi.creditStatus,
    enabled: Boolean(userId), staleTime: 0, refetchOnMount: 'always',
    refetchOnWindowFocus: 'always', refetchInterval: 30000,
  });
  return { ...query, allowed: query.isSuccess && !query.isError && !query.isFetching && query.data?.canReceive === true };
}
