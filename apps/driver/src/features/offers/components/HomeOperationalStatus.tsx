import { useDriverHealth } from "@/lib/driverHealth";
import { Button, Card, Typography as Text, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  online: boolean;
  active: boolean;
  loading: boolean;
  blocker?: { title: string; action?: string; onPress?: () => void };
  onDiagnostics: () => void;
  children?: ReactNode;
};

const freshnessMs = 30_000;

export function HomeOperationalStatus({ online, active, loading, blocker, onDiagnostics, children }: Props) {
  const colors = useThemeColors();
  const health = useDriverHealth();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tracking = online || active;
  const locationBlocked = tracking && (health.servicesEnabled === false || health.foregroundGranted === false);
  const fresh = health.servicesEnabled === true && health.foregroundGranted === true
    && health.lastSampleAt != null && now - health.lastSampleAt <= freshnessMs
    && health.lastSentAt != null && now - health.lastSentAt <= freshnessMs;
  const disconnected = tracking && !fresh && !health.connected;
  const waitingGps = tracking && !fresh;
  const reason = !active && blocker ? blocker.title
    : locationBlocked ? (health.servicesEnabled === false ? "Dịch vụ vị trí đang tắt" : "Cần cấp quyền vị trí")
    : disconnected ? "Đang kết nối lại"
    : waitingGps ? "Đang chờ vị trí GPS mới"
    : undefined;
  const title = loading ? "Đang kiểm tra trạng thái"
    : reason ?? (active ? "Đang thực hiện chuyến" : online ? "Sẵn sàng nhận chuyến" : "Đang tạm ngừng nhận chuyến");
  const warning = !loading && Boolean(reason);
  const ready = !loading && !reason && online && !active;
  const action = !active && blocker?.action
    ? { label: blocker.action, onPress: blocker.onPress }
    : locationBlocked ? { label: "Kiểm tra quyền vị trí", onPress: onDiagnostics }
    : disconnected || waitingGps ? { label: "Kiểm tra kết nối và GPS", onPress: health.retry }
    : undefined;

  return (
    <Card style={[styles.card, { backgroundColor: warning ? colors.warningContainer : colors.cardSurface }]}>
      <View style={styles.heading}>
        <MaterialIcons
          name={warning ? "warning-amber" : ready ? "check-circle-outline" : "info-outline"}
          color={warning ? colors.onWarningContainer : ready ? colors.successStrong : colors.onSurfaceVariant}
          size={26}
          importantForAccessibility="no"
        />
        <Text accessibilityRole="header" accessibilityLiveRegion="polite"
          style={[styles.title, { color: warning ? colors.onWarningContainer : colors.onSurface }]}>{title}</Text>
      </View>
      {!loading && action ? <Button variant="secondary" label={action.label} onPress={action.onPress} /> : null}
      {!loading ? children : null}
      {!locationBlocked || action?.onPress !== onDiagnostics ? (
        <Button variant="secondary" label="Chi tiết kết nối và GPS" onPress={onDiagnostics} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 12 },
  heading: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontSize: 22, lineHeight: 29, fontWeight: "700" },
});
