import type { CustomerRideDetail } from '@datxe/shared';
import { MotionPressable, Typography, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { canDriverChat } from '@/lib/chatAvailability';

export function DriverChatButton({ ride, compact = false }: { ride: CustomerRideDetail; compact?: boolean }) {
  const router = useRouter();
  const s = useThemedStyles(styles);
  const c = useThemeColors();
  if (!canDriverChat(ride)) return null;
  const unread = ride.unreadChatCount ?? 0;
  const label = unread ? `Nhắn tin với khách · ${unread} tin chưa đọc` : 'Nhắn tin với khách';
  return <MotionPressable accessibilityRole="button" accessibilityLabel={label} style={[s.button, compact && s.compact]} onPress={() => router.push({ pathname: '/chat', params: { rideId: String(ride.id) } })}>
    <MaterialIcons name="chat-bubble-outline" size={23} color={c.primary} />
    {!compact ? <Typography style={s.label}>Nhắn tin với khách</Typography> : null}
    {unread > 0 ? <View style={s.badge}><Typography style={s.count}>{unread > 99 ? '99+' : unread}</Typography></View> : null}
  </MotionPressable>;
}
const styles = (c: ThemeColors) => StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 48, borderRadius: 14, backgroundColor: c.surfaceContainerLow },
  compact: { padding: 8 },
  label: { flex: 1, color: c.primary, fontWeight: '600' },
  badge: { backgroundColor: c.primary, borderRadius: 12, minWidth: 24, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  count: { color: c.onPrimary, fontSize: 12, fontWeight: '700' },
});
