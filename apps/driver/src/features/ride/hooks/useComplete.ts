import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerRideDetail } from '@datxe/shared';
import { getDriverRide, confirmCashReceived } from '../api';

export function useComplete() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const id = Number(rideId);
  const valid = Number.isSafeInteger(id) && id > 0;
  const key = ['driver', 'ride', id];
  const query = useQuery({ queryKey: key, queryFn: () => getDriverRide(id), enabled: valid, refetchOnWindowFocus: 'always', refetchInterval: q => q.state.data?.payment?.status === 'PENDING' ? 5000 : false });
  const refetch = query.refetch;
  useRefreshOnFocus(useCallback(() => valid ? refetch() : undefined, [valid, refetch]));
  const cash = useMutation({
    mutationFn: () => {
      if (!valid || query.data?.status !== 'COMPLETED' || query.data.payment?.method !== 'CASH' || query.data.payment.status !== 'PENDING')
        throw new Error('Chuyến không còn chờ thu tiền mặt.');
      return confirmCashReceived(id);
    },
    onError: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); },
    onSuccess: async payment => {
      if (payment) client.setQueryData<CustomerRideDetail | null>(key, current => current?.payment ? {
        ...current, payment: { ...current.payment, amount: payment.amount, status: payment.status, paidAt: payment.paidAt },
      } : current);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['driver'] }),
      ]);
    },
  });
  return { query, cash, router, valid };
}
