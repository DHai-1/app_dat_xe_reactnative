import { DriverPage } from '@/components/DriverPage';
import { useDriverCredit } from '@/lib/useDriverCredit';
import { useWalletHistory, useWalletOverview } from '@/lib/useWallet';
import { walletBalance, formatMoney } from '@datxe/shared';
import { Button, WalletBalanceCard, WalletHistorySection, WalletLoadState } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
export default function DriverWalletScreen() {
  const router = useRouter();
  const overview = useWalletOverview();
  const history = useWalletHistory();
  const credit = useDriverCredit();
  return <DriverPage title="Ví tài xế">
    <WalletBalanceCard title="Ví tín dụng" balance={walletBalance(overview.data, 'CREDIT')}
      description={credit.data ? `Dùng trả chiết khấu. Hạn mức nhận chuyến ${formatMoney(credit.data.minimumCredit)}.${credit.data.shortfall > 0 ? ` Cần nạp thêm ${formatMoney(credit.data.shortfall)}.` : ''}` : 'Dùng trả chiết khấu và duy trì điều kiện nhận chuyến.'}>
      <Button label="Nạp tiền" icon="add" onPress={() => router.push('/profile/top-up')} />
    </WalletBalanceCard>
    <WalletBalanceCard title="Ví tiền mặt" balance={walletBalance(overview.data, 'CASH')} description="Thu nhập từ các chuyến thanh toán bằng ví. Số dư khả dụng đã trừ khoản đang giữ để chờ duyệt rút.">
      <Button label="Rút tiền" onPress={() => router.push('/profile/withdraw')} />
    </WalletBalanceCard>
    <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
    <Button variant="ghost" label="Cập nhật ví và lịch sử" onPress={() => void Promise.all([overview.refetch(), history.refetch(), credit.refetch()])} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {([{ kind: undefined, label: 'Tất cả ví' }, { kind: 'CREDIT' as const, label: 'Tín dụng' }, { kind: 'CASH' as const, label: 'Tiền mặt' }]).map(item => <Chip style={{ minHeight: 48, justifyContent: 'center' }} key={item.label} selected={history.filter === item.kind} onPress={() => history.setFilter(item.kind)}>{item.label}</Chip>)}
    </View>
    <WalletHistorySection items={history.items} loading={history.isLoading} error={history.error?.message} hasMore={history.hasNextPage} loadingMore={history.isFetchingNextPage}
      onMore={() => void history.fetchNextPage()} onRetry={() => void history.refetch()} onOpenRide={id => router.push({ pathname: '/ride/complete', params: { rideId: String(id) } })} />
  </DriverPage>;
}
