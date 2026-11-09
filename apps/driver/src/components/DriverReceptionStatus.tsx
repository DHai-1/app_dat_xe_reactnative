import { useDriverHealth } from "@/lib/driverHealth";
import { useSessionStore } from "@/lib/store";
import { Button, Card, Typography as Text } from "@datxe/ui";
import { useEffect, useState } from "react";
import { Linking, StyleSheet } from "react-native";

export function DriverReceptionStatus({ detailed = false, onDetails }: { detailed?: boolean; onDetails?: () => void } = {}) {
  const health = useDriverHealth();
  const user = useSessionStore((state) => state.user);
  const active = useSessionStore((state) => state.activeRide);
  const [now, setNow] = useState(Date.now);
  const [settingsError, setSettingsError] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!user) return null;

  const online = user.status === "ONLINE";
  const gpsFresh = health.lastSampleAt != null && now - health.lastSampleAt <= 30000;
  const sent = health.lastSentAt != null && now - health.lastSentAt <= 30000;
  const locationReady = health.foregroundGranted && health.servicesEnabled && gpsFresh && sent;
  const problem = !health.connected && !sent
    ? "Đang kết nối lại với máy chủ."
    : health.servicesEnabled === false
      ? "Bật dịch vụ vị trí để tiếp tục."
      : health.foregroundGranted === false
        ? "Cấp quyền vị trí để tiếp tục."
        : "Đang chờ vị trí mới được gửi.";
  const status = active
    ? "Đang thực hiện chuyến"
    : !online
      ? "Đang tạm ngừng nhận chuyến"
      : locationReady
        ? "Đã bật nhận chuyến · Kết nối và GPS sẵn sàng"
        : "Đã bật nhận chuyến · Chưa đủ điều kiện nhận chuyến";
  const needsLocation = online || Boolean(active);
  const permissionsMissing = health.servicesEnabled === false || health.foregroundGranted === false;
  const openSettings = () => {
    setSettingsError("");
    void Linking.openSettings().catch(() => setSettingsError("Chưa mở được cài đặt quyền vị trí."));
  };

  return (
    <Card radius={20} style={styles.card}>
      <Text accessibilityRole="header">{active ? "Tình trạng chia sẻ vị trí chuyến" : "Tình trạng nhận chuyến"}</Text>
      <Text accessibilityLiveRegion="polite">{status}</Text>
      {needsLocation && !locationReady ? <Text>{problem}</Text> : null}
      {detailed ? (
        <>
          <Text>Kết nối: {health.connected ? "đã kết nối" : sent ? "đang dùng kết nối dự phòng" : "đang kết nối lại"}</Text>
          <Text>
            GPS: {health.servicesEnabled === false
              ? "dịch vụ vị trí đang tắt"
              : health.foregroundGranted === false
                ? "chưa cấp quyền"
                : gpsFresh ? "có vị trí mới" : "đang chờ vị trí mới"}
          </Text>
          {health.lastSampleAt ? (
            <Text>
              Đo lúc {new Date(health.lastSampleAt).toLocaleTimeString("vi-VN")} ·{" "}
              {Math.max(0, Math.floor((now - health.lastSampleAt) / 1000))} giây trước
            </Text>
          ) : null}
          <Text>Vị trí nền: {health.backgroundRunning ? "đang bật" : health.backgroundGranted === false ? "chưa cấp quyền" : "chưa hoạt động"}</Text>
        </>
      ) : null}
      {needsLocation && !health.backgroundRunning ? <Text>Giữ app mở để chia sẻ vị trí. Bật quyền vị trí nền nếu cần chuyển ứng dụng.</Text> : null}
      {detailed && health.error ? <Text accessibilityRole="alert">{health.error}</Text> : null}
      {settingsError ? <Text accessibilityRole="alert">{settingsError}</Text> : null}
      {detailed && needsLocation && (!locationReady || !health.backgroundRunning) ? (
        <>
          <Button label="Kiểm tra lại kết nối và GPS" variant="secondary" onPress={health.retry} />
          <Button label="Mở cài đặt quyền vị trí" variant="ghost" onPress={openSettings} />
        </>
      ) : null}
      {!detailed && needsLocation && !locationReady ? (
        <Button variant="secondary" label={permissionsMissing ? "Kiểm tra quyền vị trí" : "Kiểm tra lại kết nối và GPS"}
          onPress={permissionsMissing ? onDetails ?? openSettings : health.retry} />
      ) : null}
      {onDetails && !(needsLocation && permissionsMissing && !locationReady) ? <Button variant="ghost" icon="info-outline" iconPosition="leading" label="Chi tiết kết nối và GPS" onPress={onDetails} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: 8 } });
