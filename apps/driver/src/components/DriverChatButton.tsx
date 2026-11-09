import type { CustomerRideDetail } from '@datxe/shared';
import { MotionPressable, Typography, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { canDriverChat } from '@/lib/chatAvailability';

export function DriverChatButton({ ride, compact = false, onOpen }: {
  ride: CustomerRideDetail;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const s = useThemedStyles(styles);
  const c = useThemeColors();
  if (!canDriverChat(ride)) return null;
  const unread = ride.unreadChatCount ?? 0;
  const label = unread ? `Nhắn tin với khách · ${unread} tin chưa đọc` : 'Nhắn tin với khách';
  return <MotionPressable accessibilityRole="button" accessibilityLabel={label} style={[s.button, compact && s.compact]} onPress={() => {
    onOpen?.();
    router.push({ pathname: '/chat', params: { rideId: String(ride.id) } });
  }}>
    <MaterialIcons name="chat-bubble-outline" size={23} color={c.onSurfaceVariant} />
    {!compact ? <Typography style={s.label}>Nhắn tin với khách</Typography> : null}
    {unread > 0 ? <View style={s.badge}><Typography style={s.count}>{unread > 99 ? '99+' : unread}</Typography></View> : null}
  </MotionPressable>;
}
const styles = (c: ThemeColors) => StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, minHeight: 48, minWidth: 48, borderRadius: 999, backgroundColor: c.surfaceContainerLow },
  compact: { padding: 8 },
  label: { flex: 1, color: c.onSurface, fontWeight: '600' },
  badge: { backgroundColor: c.secondaryContainer, borderRadius: 999, minWidth: 24, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  count: { color: c.onSecondaryContainer, fontSize: 13, fontWeight: '700' },
});
