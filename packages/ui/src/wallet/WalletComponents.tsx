import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Dialog, Divider, Portal } from 'react-native-paper';
import { formatMoney, getLocale, parseWalletAmount, walletAttempt, type WalletAttempt, type WalletEntry } from '@datxe/shared';
import { Button, Card, PaperTextInput, Typography as Text } from '../components';
import { useThemeColors } from '../theme/ThemeProvider';
import { typography } from '../theme/colors';

export function WalletBalanceCard({ title, balance, description, children }: { title: string; balance?: number; description: string; children?: ReactNode }) {
  const c = useThemeColors();
  return <Card style={[s.card, { backgroundColor: c.surfaceContainerLow }]}>
    <Text style={[typography.titleMd, { color: c.onSurfaceVariant }]}>{title}</Text>
    <Text accessibilityLabel={`${title}: ${balance === undefined ? 'Chưa tải được số dư' : formatMoney(balance)}`}
      style={[typography.headlineLg, s.amount, { color: balance !== undefined && balance < 0 ? c.error : c.onSurface }]}>{balance === undefined ? '—' : formatMoney(balance)}</Text>
    <Text style={[typography.bodyMd, { color: c.onSurfaceVariant }]}>{description}</Text>
    {children ? <View style={s.actions}>{children}</View> : null}
  </Card>;
}
export function WalletLoadState({ loading, error, onRetry }: { loading?: boolean; error?: string; onRetry: () => void }) {
  const c = useThemeColors();
  return <>{loading ? <ActivityIndicator accessibilityLabel="Đang tải ví" /> : null}{error ? <Card style={s.card}>
    <Text accessibilityRole="alert" style={{ color: c.error }}>{error}</Text>
    <Button variant="secondary" label="Thử lại" onPress={onRetry} />
  </Card> : null}</>;
}
const transactionLabel = { TOP_UP: 'Nạp tiền', WITHDRAW: 'Rút tiền', RIDE_PAYMENT: 'Thanh toán chuyến', COMMISSION_FEE: 'Chiết khấu chuyến', REFUND: 'Hoàn tiền' };
export const walletStatusLabel = { PENDING: 'Đang chờ xử lý', SUCCESS: 'Đã hoàn tất', FAILED: 'Không thành công' };
export function WalletHistorySection({ items, loading, error, hasMore, loadingMore, onMore, onRetry, onOpenRide }: {
  items: WalletEntry[]; loading: boolean; error?: string; hasMore: boolean; loadingMore: boolean;
  onMore: () => void; onRetry: () => void; onOpenRide: (id: number) => void;
}) {
  const c = useThemeColors();
  return <View style={s.stack}>
    <Text accessibilityRole="header" style={typography.titleLg}>Lịch sử giao dịch</Text>
    <WalletLoadState loading={loading} error={error} onRetry={onRetry} />
    {!loading && !error && !items.length ? <Card style={s.card}><Text>Chưa có giao dịch. Các khoản nạp, thanh toán và hoàn tiền sẽ hiển thị tại đây.</Text></Card> : null}
    {items.map(item => <Card key={item.transactionId} style={s.card}>
      <View style={s.row}>
        <View style={s.grow}>
          <Text style={typography.titleMd}>{transactionLabel[item.transactionType] ?? item.transactionType}</Text>
          <Text style={[typography.bodyMd, { color: c.onSurfaceVariant }]}>{item.walletType === 'CREDIT' ? 'Ví tín dụng' : item.walletType === 'CASH' ? 'Ví tiền mặt' : 'Ví ứng dụng'}</Text>
        </View>
        <Text style={[typography.titleLg, s.amount, { color: item.status === 'FAILED' ? c.onSurfaceVariant : item.amount > 0 ? c.primary : c.onSurface }]}>{item.amount > 0 ? '+' : ''}{formatMoney(item.amount)}</Text>
      </View>
      <Text style={[typography.labelLg, { color: item.status === 'FAILED' ? c.error : c.onSurfaceVariant }]}>{walletStatusLabel[item.status]}</Text>
      {item.description ? <Text style={typography.bodyMd}>{item.description}</Text> : null}
      <Divider />
      <Text style={[typography.bodyMd, { color: c.onSurfaceVariant }]}>GD #{item.transactionId} · {new Date(item.createdAt).toLocaleString(getLocale())}</Text>
      {item.balanceAfter != null ? <Text style={typography.bodyMd}>Số dư sau giao dịch: {formatMoney(item.balanceAfter)}</Text> : null}
      {item.withdrawalId ? <Text style={typography.bodyMd}>Yêu cầu rút #{item.withdrawalId}{item.status === 'FAILED' ? ' · Khoản giữ tiền đã được hoàn lại' : ''}</Text> : null}
      {item.referenceTripId ? <Button variant="ghost" label={`Xem chuyến #${item.referenceTripId}`} onPress={() => onOpenRide(item.referenceTripId!)} /> : null}
    </Card>)}
    {hasMore ? <Button variant="secondary" label="Xem thêm giao dịch" loading={loadingMore} onPress={onMore} /> : items.length && !error ? <Text style={{ color: c.onSurfaceVariant }}>Đã hiển thị toàn bộ giao dịch.</Text> : null}
  </View>;
}

export function WalletMoneyForm({ mode, maxAmount, available, onSubmit, onDone }: {
  mode: 'topup' | 'withdraw'; maxAmount: number; available?: number;
  onSubmit: (amount: number, key: string) => Promise<unknown>; onDone: () => void;
}) {
  const c = useThemeColors();
  const [amount, setAmount] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const attempt = useRef<WalletAttempt | undefined>(undefined);
  const submitting = useRef(false);
  const value = parseWalletAmount(amount, maxAmount);
  const retrying = value !== null && attempt.current?.amount === value;
  const exceeds = mode === 'withdraw' && value !== null && !retrying && (available === undefined || value > available);
  const submit = async () => {
    if (value === null || exceeds || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    attempt.current = walletAttempt(attempt.current, value);
    try { await onSubmit(value, attempt.current.key); setReview(false); setDone(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xử lý được giao dịch. Vui lòng thử lại.'); }
    finally { submitting.current = false; setBusy(false); }
  };
  if (done) return <Card style={s.card}>
    <Text accessibilityRole="alert" style={typography.titleLg}>{mode === 'topup' ? 'Nạp tiền thành công' : 'Đã gửi yêu cầu rút tiền'}</Text>
    <Text>{mode === 'topup' ? 'Số dư đã được cập nhật.' : 'Số tiền được tạm giữ để chờ duyệt. Nếu bị từ chối, tiền sẽ tự động hoàn về ví tiền mặt.'}</Text>
    <Button label="Hoàn tất" onPress={onDone} />
  </Card>;
  return <Card style={s.card}>
    <Text style={typography.titleLg}>{mode === 'topup' ? 'Nạp tiền giả lập' : 'Tạo yêu cầu rút tiền'}</Text>
    <Text style={{ color: c.onSurfaceVariant }}>{mode === 'topup' ? 'Chế độ thử nghiệm, không thu tiền thật.' : 'Chỉ rút từ ví tiền mặt. Số tiền sẽ được giữ ngay khi gửi yêu cầu và chờ quản trị viên duyệt.'}</Text>
    <PaperTextInput label="Số tiền (đ)" draftValue={amount} onChangeText={setAmount} keyboardType="number-pad" maxLength={15} disabled={busy} error={Boolean(amount && (value === null || exceeds))} />
    <View style={s.chips}>{[50000,100000,200000].filter(x => x <= maxAmount && (mode !== 'withdraw' || (available !== undefined && x <= available))).map(x => <Chip style={{ minHeight: 48, justifyContent: 'center' }} key={x} selected={value === x} disabled={busy} onPress={() => setAmount(String(x))}>{formatMoney(x)}</Chip>)}</View>
    <Text style={{ color: exceeds || (amount && value === null) ? c.error : c.onSurfaceVariant }}>{exceeds ? 'Số dư ví tiền mặt không đủ.' : mode === 'withdraw' ? `Số dư có thể rút: ${available === undefined ? 'Chưa xác định' : formatMoney(available)}. Nhập số nguyên đồng.` : `Nhập số nguyên từ 1 đến ${formatMoney(maxAmount)}.`}</Text>
    <Button label="Tiếp tục" disabled={value === null || exceeds || busy} onPress={() => { setError(''); setReview(true); }} />
    <Portal><Dialog visible={review} dismissable={!busy} dismissableBackButton={!busy} onDismiss={() => setReview(false)} style={{ borderRadius: 28, backgroundColor: c.surfaceContainerHigh }}>
      <Dialog.Title>{mode === 'topup' ? 'Xác nhận nạp giả lập' : 'Xác nhận rút tiền'}</Dialog.Title>
      <Dialog.Content><View style={s.stack}>
        <Text style={typography.headlineMd}>{value === null ? '—' : formatMoney(value)}</Text>
        <Text>{mode === 'topup' ? 'Tiền thử nghiệm sẽ được cộng vào ví của bạn.' : 'Khoản tiền này được trừ khỏi số dư khả dụng để chờ duyệt.'}</Text>
        {error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{error}</Text> : null}
        <Button label={mode === 'topup' ? 'Xác nhận nạp' : 'Gửi yêu cầu rút'} loading={busy} onPress={() => void submit()} />
        <Button variant="ghost" label="Hủy" disabled={busy} onPress={() => setReview(false)} />
      </View></Dialog.Content>
    </Dialog></Portal>
  </Card>;
}
const s = StyleSheet.create({ card: { padding: 20, gap: 12, borderRadius: 24 }, stack: { gap: 16 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }, grow: { flexGrow: 1 }, actions: { gap: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, amount: { fontVariant: ['tabular-nums'], flexShrink: 1 } });
