import { DriverPage } from '@/components/DriverPage';
import { formatMoney } from '@datxe/shared';
import { Button, Card, Typography as Text, typography } from '@datxe/ui';
import { useRouter } from 'expo-router';
import type { useDriverCredit } from '@/lib/useDriverCredit';

export function DriverCreditGate({ credit }: { credit: ReturnType<typeof useDriverCredit> }) {
  const router = useRouter();
  const checking = credit.isFetching;
  return <DriverPage title="Điều kiện nhận chuyến" loading={checking} error={credit.error?.message} retry={credit.refetch}>
    <Card style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={typography.titleLg}>{checking ? 'Đang kiểm tra ví tín dụng' : credit.isError || !credit.data ? 'Chưa kiểm tra được số dư' : 'Chưa đủ số dư để nhận chuyến'}</Text>
      {credit.data ? <Text>Số dư: {formatMoney(credit.data.creditBalance)}. Hạn mức: {formatMoney(credit.data.minimumCredit)}. Cần nạp thêm {formatMoney(credit.data.shortfall)}.</Text> : <Text>Cần kiểm tra được số dư trước khi nhận chuyến. Vui lòng kiểm tra kết nối và thử lại.</Text>}
      <Button label="Nạp tiền" onPress={() => router.push('/profile/top-up')} />
      <Button variant="secondary" label="Kiểm tra lại số dư" loading={checking} onPress={() => void credit.refetch()} />
      <Button variant="ghost" label="Về trang chủ" onPress={() => router.replace('/(tabs)/home')} />
    </Card>
  </DriverPage>;
}
