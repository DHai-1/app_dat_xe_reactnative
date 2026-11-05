import { useDriverHealth } from '@/lib/driverHealth';
import { useSessionStore } from '@/lib/store';
import { Button, Card, Typography as Text } from '@datxe/ui';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

export function DriverReceptionStatus() {
  const health = useDriverHealth();
  const user = useSessionStore(state => state.user);
  const active = useSessionStore(state => state.activeRide);
  const [now, setNow] = useState(Date.now);
  const [settingsError, setSettingsError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!user) return null;
  const online = user.status === 'ONLINE';
  const gpsFresh = health.lastSampleAt != null && now - health.lastSampleAt <= 30000;
  const sent = health.lastSentAt != null && now - health.lastSentAt <= 30000;
  const ready = online && !active && health.connected && health.foregroundGranted && health.servicesEnabled && gpsFresh && sent;
  return <Card style={styles.card}>
    <Text accessibilityRole="header">{active ? 'Tình trạng chia sẻ vị trí chuyến' : 'Tình trạng nhận chuyến'}</Text>
    <Text accessibilityRole="alert">{active ? 'Đang thực hiện chuyến' : !online ? 'Đang tạm ngừng nhận chuyến' : ready ? 'Đã bật nhận chuyến · Kết nối và GPS sẵn sàng' : 'Đã bật nhận chuyến · Chưa đủ điều kiện kết nối/GPS'}</Text>
    <Text>Kết nối: {health.connected ? 'đã kết nối' : 'đang mất kết nối / kết nối lại'}</Text>
    <Text>GPS: {health.servicesEnabled === false ? 'dịch vụ vị trí đang tắt' : health.foregroundGranted === false ? 'chưa cấp quyền' : gpsFresh ? 'có vị trí mới' : 'đang chờ vị trí mới'}</Text>
    {health.lastSampleAt ? <Text>Đo lúc {new Date(health.lastSampleAt).toLocaleTimeString('vi-VN')} · {Math.max(0, Math.floor((now - health.lastSampleAt) / 1000))} giây trước</Text> : null}
    <Text>Vị trí nền: {health.backgroundRunning ? 'đang bật' : health.backgroundGranted === false ? 'chưa cấp quyền' : 'chưa hoạt động'}</Text>
    {(online || active) && !health.backgroundRunning ? <Text>Giữ app mở để chia sẻ vị trí. Bật quyền vị trí nền để tiếp tục khi chuyển sang ứng dụng khác.</Text> : null}
    {health.error ? <Text accessibilityRole="alert">{health.error}</Text> : null}
    {settingsError ? <Text accessibilityRole="alert">{settingsError}</Text> : null}
    {(online || active) && (!ready || !health.backgroundRunning) ? <>
      <Button label="Kiểm tra lại kết nối và GPS" variant="secondary" onPress={health.retry} />
      <Button label="Mở cài đặt quyền vị trí" variant="ghost" onPress={() => { void Linking.openSettings().catch(() => setSettingsError('Chưa mở được cài đặt. Hãy mở Cài đặt hệ thống → Ứng dụng → Quyền vị trí.')); }} />
    </> : null}
  </Card>;
}
const styles = StyleSheet.create({ card: { gap: 8 } });
