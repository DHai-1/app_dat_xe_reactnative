import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';
import { useCallback, useRef } from 'react';
import { DriverPage } from '@/components/DriverPage';
import { useWalletOverview } from '@/lib/useWallet';
import { createWithdrawal, getWithdrawal, getWithdrawals, walletApi } from '@/lib/walletApi';
import { driverApi } from '@/lib/driverApi';
import { useSessionStore } from '@/lib/store';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { formatMoney, persistWalletAttempt, readWalletAttempt, walletBalance } from '@datxe/shared';
import { Button, Card, Typography as Text, WalletBalanceCard, WalletLoadState, WalletMoneyForm, typography, walletStatusLabel } from '@datxe/ui';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
export default function DriverWithdrawalScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  const sending = useRef(false);
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const selectedId = Number(requestId);
  const reviewing = Number.isSafeInteger(selectedId) && selectedId > 0;
  const selected = useQuery({ queryKey: ['driver', 'withdrawals', userId, selectedId], queryFn: () => getWithdrawal(selectedId),
    enabled: Boolean(userId) && Number.isSafeInteger(selectedId) && selectedId > 0, refetchInterval: 30000 });
  const selectedRefetch = selected.refetch;
  const refreshSelected = useCallback(() => { if (Number.isSafeInteger(selectedId) && selectedId > 0) return selectedRefetch(); }, [selectedId, selectedRefetch]);
  useRefreshOnFocus(refreshSelected);
  const bank = useQuery({ queryKey: ['driver', 'profile'], queryFn: driverApi.profile, enabled: Boolean(userId), refetchOnMount: 'always' });
  useRefreshOnFocus(bank.refetch);
  const hasBank = Boolean(bank.data?.bank_name?.trim() && bank.data?.bank_account_number?.trim());
  const overview = useWalletOverview();
  const cash = walletBalance(overview.data, 'CASH');
  const requests = useInfiniteQuery({ queryKey: ['driver', 'withdrawals', userId], initialPageParam: 0, queryFn: ({ pageParam }) => getWithdrawals(pageParam),
    enabled: Boolean(userId), getNextPageParam: page => page.last ? undefined : page.number + 1, refetchInterval: 30000 });
  useRefreshOnFocus(requests.refetch);
  const items = Array.from(new Map((requests.data?.pages.flatMap(page => page.content) ?? []).map(item => [item.id, item])).values());
  const submit = async (amount: number, _key: string) => {
    if (!userId || sending.current) throw new Error('Yêu cầu đang được xử lý.');
    sending.current = true;
    try {
      const scope = `wallet-attempt:${env.apiUrl}:driver:${userId}:withdraw`;
      const previous = await readWalletAttempt(AsyncStorage, scope);
      const latest = await walletApi.overview();
      if (useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
      const balance = walletBalance(latest, 'CASH');
      if (previous?.amount !== amount && (balance === undefined || balance < amount)) throw new Error('Số dư ví tiền mặt không đủ.');
      const attempt = await persistWalletAttempt(AsyncStorage, scope, amount);
      await createWithdrawal(amount, attempt.key);
      await AsyncStorage.removeItem(scope);
      await client.invalidateQueries({ queryKey: ['driver'] });
    } finally { sending.current = false; }
  };
  return <DriverPage title="Rút tiền">
    <WalletBalanceCard title="Ví tiền mặt khả dụng" balance={cash} description="Tiền đang chờ duyệt rút đã được trừ khỏi số dư khả dụng. Ví tín dụng không thể rút." />
    <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
    <Card style={{ gap: 10 }}>
      <Text style={typography.titleLg}>Tài khoản nhận tiền</Text>
      <WalletLoadState loading={bank.isLoading} error={bank.error?.message} onRetry={() => void bank.refetch()} />
      {hasBank ? <><Text>{bank.data?.bank_name}</Text><Text>Số tài khoản: {bank.data?.bank_account_number}</Text></> : !bank.isLoading && !bank.isError ? <Text>Bổ sung tên ngân hàng và số tài khoản chính chủ trước khi gửi yêu cầu rút tiền.</Text> : null}
      <Button variant="secondary" label={hasBank ? 'Cập nhật tài khoản ngân hàng' : 'Bổ sung tài khoản ngân hàng'} onPress={() => router.push('/profile/edit')} />
    </Card>
    {cash !== undefined && !overview.isError && hasBank && !bank.isError && !reviewing ? <WalletMoneyForm mode="withdraw" maxAmount={Number.MAX_SAFE_INTEGER} available={cash} onSubmit={submit} onDone={() => router.dismissTo('/profile/wallet')} /> : null}
    {reviewing ? <Button variant="secondary" label="Tạo yêu cầu rút tiền mới" onPress={() => router.setParams({ requestId: '' })} /> : null}
    <Button variant="ghost" label="Cập nhật yêu cầu rút" onPress={() => void Promise.all([overview.refetch(), requests.refetch()])} />
    <Text accessibilityRole="header" style={typography.titleLg}>Yêu cầu rút tiền của tôi</Text>
    <WalletLoadState loading={requests.isLoading} error={requests.error?.message} onRetry={() => void requests.refetch()} />
    {!requests.isLoading && !requests.isError && !items.length ? <Card><Text>Chưa có yêu cầu rút tiền.</Text></Card> : null}
    {reviewing ? <WalletLoadState loading={selected.isLoading} error={selected.error?.message} onRetry={() => void selected.refetch()} /> : null}
    {(selected.data ? [selected.data, ...items.filter(item => item.id !== selected.data.id)] : items).map(item => <Card key={item.id} style={{ gap: 10 }}>
      <Text style={typography.titleLg}>{formatMoney(item.amount)}</Text>
      <Text style={typography.labelLg}>{(item.status === 'FAILED' || item.status === 'REJECTED') ? 'Đã từ chối · Đã hoàn tiền' : walletStatusLabel[item.status]}</Text>
      {item.rejectReason ? <Text accessibilityRole="alert">Lý do từ chối: {item.rejectReason}</Text> : null}
      <Text>Yêu cầu #{item.id} · {new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
      {item.reviewedAt ? <Text>Xử lý lúc {new Date(item.reviewedAt).toLocaleString('vi-VN')}</Text> : <Text>Đang chờ quản trị viên kiểm tra và duyệt.</Text>}
    </Card>)}
    {requests.hasNextPage ? <Button variant="secondary" label="Xem thêm yêu cầu" loading={requests.isFetchingNextPage} onPress={() => void requests.fetchNextPage()} /> : null}
  </DriverPage>;
}
