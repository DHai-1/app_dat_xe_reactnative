import { DriverPage } from '@/components/DriverPage';
import { useDriverCredit } from '@/lib/useDriverCredit';
import { useWalletOverview, useWalletTopUp } from '@/lib/useWallet';
import { walletBalance, formatMoney } from '@datxe/shared';
import { Button, Card, Typography as Text, WalletBalanceCard, WalletLoadState, WalletMoneyForm } from '@datxe/ui';
import { useRouter } from 'expo-router';
export default function DriverTopUpScreen() {
  const router = useRouter();
  const overview = useWalletOverview();
  const credit = useDriverCredit();
  const submit = useWalletTopUp();
  return <DriverPage title="Nạp ví tín dụng">
    <WalletBalanceCard title="Ví tín dụng" balance={walletBalance(overview.data, 'CREDIT')}
      description={credit.data ? `Hạn mức nhận chuyến ${formatMoney(credit.data.minimumCredit)}. Cần nạp thêm ${formatMoney(credit.data.shortfall)}.` : 'Nạp tiền để duy trì điều kiện nhận chuyến.'} />
    <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
    {overview.data && !overview.isError ? overview.data.mockTopUpEnabled ? <WalletMoneyForm mode="topup" maxAmount={overview.data.maxTopUpAmount} onSubmit={submit} onDone={() => router.dismissTo('/profile/wallet')} /> : <Card style={{ gap: 16 }}>
      <Text>Hiện chưa có cổng nạp tiền trực tuyến. Vui lòng liên hệ hỗ trợ để được hướng dẫn nạp vào ví tín dụng.</Text>
      <Button label="Liên hệ hỗ trợ nạp tiền" onPress={() => router.push('/support')} />
    </Card> : null}
  </DriverPage>;
}
