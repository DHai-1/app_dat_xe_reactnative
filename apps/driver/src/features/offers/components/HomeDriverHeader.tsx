import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, ActivityIndicator, TouchableRipple } from "react-native-paper";
import { Button, Card, Typography as Text, typography, useThemeColors } from "@datxe/ui";
import { formatMoney } from "@datxe/shared";
import type { DriverDailySummary } from "../api";

type Props = {
  summary: DriverDailySummary | null | undefined;
  name?: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onProfile: () => void;
};

export function HomeDriverHeader({ summary, name, loading, error, onRetry, onProfile }: Props) {
  const colors = useThemeColors();
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const fullName = summary?.fullName?.trim() || name?.trim() || "Tài xế";
  const initials = fullName.split(/\s+/).slice(-2).map(part => part[0]).join("").toUpperCase();
  return (
    <Card style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
      <TouchableRipple onPress={onProfile} accessibilityRole="button" accessibilityLabel={`Xem hồ sơ của ${fullName}`} style={styles.identityTarget}>
        <View style={styles.identity}>
          {summary?.avatarUrl && failedAvatar !== summary.avatarUrl ? (
            <Avatar.Image size={48} source={{ uri: summary.avatarUrl }} onError={() => setFailedAvatar(summary.avatarUrl)} />
          ) : (
            <Avatar.Text size={48} label={initials} color={colors.onPrimaryContainer} style={{ backgroundColor: colors.primaryContainer }} />
          )}
          <View style={styles.name}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>Xin chào,</Text>
            <Text accessibilityRole="header" style={[typography.titleLg, { color: colors.onSurface }]}>{fullName}</Text>
          </View>
        </View>
      </TouchableRipple>
      <View style={styles.content}>
        <Text style={[typography.titleMd, { color: colors.onSurface }]}>Hoạt động hôm nay</Text>
        {loading && !summary ? <ActivityIndicator accessibilityLabel="Đang tải thống kê hôm nay" /> : null}
        <View style={styles.metrics}>
          <View style={[styles.metric, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[typography.headlineMd, styles.number, { color: colors.onSecondaryContainer }]}>{summary ? summary.completedTrips.toLocaleString("vi-VN") : "—"}</Text>
            <Text style={[typography.bodyMd, { color: colors.onSecondaryContainer }]}>Chuyến hoàn thành</Text>
          </View>
          <View style={[styles.metric, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[typography.headlineMd, styles.number, { color: colors.onPrimaryContainer }]}>{summary ? formatMoney(summary.income) : "—"}</Text>
            <Text style={[typography.bodyMd, { color: colors.onPrimaryContainer }]}>Thu nhập hôm nay</Text>
          </View>
        </View>
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Thu nhập sau chiết khấu · Theo ngày thanh toán, giờ Việt Nam</Text>
        {error ? <View style={styles.error}>
          <Text accessibilityRole="alert" style={{ color: colors.error }}>{summary ? "Chưa cập nhật được thống kê mới nhất." : "Chưa tải được thống kê hôm nay."}</Text>
          <Button variant="ghost" label="Thử lại" onPress={onRetry} />
        </View> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: "hidden", borderRadius: 24 },
  identityTarget: { minHeight: 80 },
  identity: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  name: { flex: 1, gap: 4 },
  content: { padding: 16, paddingTop: 0, gap: 12 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { flex: 1, minWidth: 140, padding: 16, borderRadius: 16, gap: 8 },
  number: { fontVariant: ["tabular-nums"] },
  error: { gap: 4 },
});
