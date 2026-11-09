import { translate as t, type TicketStatus, type TicketSummary } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MotionPressable as Pressable } from '../components/MotionPressable';
import { Typography as Text } from '../components/Typography';
import { useThemedStyles, type ThemeColors } from '../theme/ThemeProvider';
import { useLanguage } from '../useLanguage';

const categoryLabels: Record<string, string> = {
  TRIP: 'Chuyến đi', PAYMENT: 'Thanh toán', HANDOVER: 'Bàn giao xe', ACCOUNT: 'Tài khoản', OTHER: 'Vấn đề khác',
};
const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Đã tiếp nhận', IN_PROGRESS: 'Đang xử lý', WAITING_FOR_USER: 'Chờ bạn phản hồi',
  RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

type Props = {
  tickets: TicketSummary[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onRetry?: () => void;
  onOpen: (id: number) => void;
  onCreate: () => void;
};

export function TicketList({ tickets, loading, refreshing, error, onRefresh, onRetry, onOpen, onCreate }: Props) {
  useLanguage();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.fill}>
      {error ? (
        <Card style={s.errorCard}>
          <Text accessibilityRole="alert" style={s.error}>{error}</Text>
          {onRetry ? <Button variant="secondary" label={t('Thử lại')} onPress={onRetry} /> : null}
        </Card>
      ) : null}
      <FlatList
        data={tickets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={s.refresh.tintColor} />}
        ListEmptyComponent={loading ? (
          <ActivityIndicator accessibilityLabel={t('Đang tải yêu cầu hỗ trợ')} style={s.loading} />
        ) : (
          <View style={s.empty}>
            <MaterialIcons name="support-agent" size={48} color={s.emptyIcon.color} />
            <Text style={s.emptyTitle}>{t('Chưa có yêu cầu hỗ trợ')}</Text>
            <Text style={s.emptyHint}>{t('Tạo yêu cầu mới để bộ phận hỗ trợ tiếp nhận.')}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={t('Mở yêu cầu {0}', { '0': item.code })} onPress={() => onOpen(item.id)}>
            <Card style={s.card}>
              <View style={s.row}>
                <Text style={s.subject} numberOfLines={1}>{categoryLabels[item.category] ?? item.category}</Text>
                <View style={[s.badge, statusTone(item.status, s)]}>
                  <Text style={[s.badgeText, { color: statusTone(item.status, s).color }]}>{statusLabels[item.status]}</Text>
                </View>
              </View>
              <Text style={s.code}>{item.code}</Text>
              <Text style={s.meta}>{t('Cập nhật')} · {new Date(item.updatedAt).toLocaleString('vi-VN')}</Text>
            </Card>
          </Pressable>
        )}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={t('Tạo yêu cầu hỗ trợ')} onPress={onCreate} style={s.fab}>
        <MaterialIcons name="add" size={28} color={s.fabIcon.color} />
      </Pressable>
    </View>
  );
}

function statusTone(status: TicketStatus, s: ReturnType<typeof makeStyles>) {
  switch (status) {
    case 'OPEN': return s.open;
    case 'WAITING_FOR_USER': return s.waiting;
    case 'IN_PROGRESS': return s.progress;
    default: return s.closed;
  }
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 96 },
  card: { padding: 16, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subject: { flex: 1, fontWeight: '700', fontSize: 16 },
  code: { color: c.onSurfaceVariant, fontSize: 12 },
  meta: { color: c.onSurfaceVariant, fontSize: 12 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, color: c.onSurface },
  badgeText: { fontSize: 11, fontWeight: '700' },
  open: { backgroundColor: c.successContainer, color: c.onSuccessContainer },
  waiting: { backgroundColor: c.warningContainer, color: c.onWarningContainer },
  progress: { backgroundColor: c.primaryContainer, color: c.onPrimaryContainer },
  closed: { backgroundColor: c.surfaceContainerHigh, color: c.onSurfaceVariant },
  errorCard: { margin: 16, gap: 8 },
  error: { color: c.error },
  loading: { marginTop: 48 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 64 },
  emptyIcon: { color: c.onSurfaceVariant },
  emptyTitle: { fontWeight: '700', fontSize: 16 },
  emptyHint: { color: c.onSurfaceVariant, textAlign: 'center' },
  refresh: { tintColor: c.primary },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary },
  fabIcon: { color: c.onPrimary },
});
