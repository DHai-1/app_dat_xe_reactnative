import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { persistWalletAttempt, type WalletKind } from '@datxe/shared';
import { walletApi } from './walletApi';
import { useSessionStore } from './store';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export function useWalletOverview() {
  const userId = useSessionStore(state => state.user?.id);
  const query = useQuery({ queryKey: ['driver', 'walletOverview', userId], queryFn: walletApi.overview,
    enabled: Boolean(userId), staleTime: 0, refetchOnWindowFocus: 'always', refetchInterval: 30000 });
  useRefreshOnFocus(query.refetch);
  return query;
}
export function useWalletHistory() {
  const userId = useSessionStore(state => state.user?.id);
  const [filter, setFilter] = useState<WalletKind | undefined>(undefined);
  const query = useInfiniteQuery({ queryKey: ['driver', 'walletHistory', userId, filter], initialPageParam: 0,
    queryFn: ({ pageParam }) => walletApi.history(pageParam, filter), enabled: Boolean(userId), staleTime: 0, refetchInterval: 30000,
    getNextPageParam: page => page.last ? undefined : page.number + 1 });
  useRefreshOnFocus(query.refetch);
  return { ...query, items: Array.from(new Map((query.data?.pages.flatMap(page => page.content) ?? []).map(item => [item.transactionId, item])).values()), filter, setFilter };
}
export function useWalletTopUp() {
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  return async (amount: number, _formKey: string) => {
    if (!userId || useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
    const overview = await walletApi.overview();
    if (!overview.mockTopUpEnabled) throw new Error('Nạp giả lập chưa được bật. Vui lòng liên hệ hỗ trợ.');
    if (useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
    const scope = `wallet-attempt:${env.apiUrl}:driver:${userId}:topup`;
    const attempt = await persistWalletAttempt(AsyncStorage, scope, amount);
    await walletApi.topUp(amount, attempt.key);
    await AsyncStorage.removeItem(scope);
    await client.invalidateQueries({ queryKey: ['driver'] });
  };
}
