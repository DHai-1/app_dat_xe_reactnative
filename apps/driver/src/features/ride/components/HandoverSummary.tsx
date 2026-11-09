import { DriverPhoto } from "@/components/DriverPhoto";
import { StatusBadge } from "@/components/StatusBadge";
import type { CustomerRideDetail } from "@datxe/shared";
import { Card, Typography as Text, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { PHOTO_ANGLES, photoAngleLabel } from "../photoAngles";

type Report = CustomerRideDetail["handoverReports"][number];
const angleOrder: readonly string[] = PHOTO_ANGLES.map(([angle]) => angle);

export function HandoverSummary({
  report, status, children,
}: {
  report: Report;
  status?: CustomerRideDetail["status"];
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const photos = [...report.photos].sort((a, b) => {
    const rank = (angle: string) => {
      const index = angleOrder.indexOf(angle);
      return index < 0 ? angleOrder.length : index;
    };
    return rank(a.angle) - rank(b.angle);
  });

  return (
    <Card style={[styles.card, { backgroundColor: colors.rideSurface }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          {report.phase === "PICKUP" ? "Biên bản nhận xe" : "Biên bản trả xe"}
        </Text>
        {status ? <StatusBadge kind="ride" value={status} contextLabel="Trạng thái chuyến" /> : null}
      </View>
      <Text style={{ color: colors.onSurfaceVariant }}>
        {report.confirmedByCustomer ? "Khách đã xác nhận" : "Chờ khách xác nhận"}
      </Text>
      <View style={styles.stats}>
        {([
          { icon: "speed", label: "Số km đồng hồ", value: `${report.odometer.toLocaleString("vi-VN")} km` },
          { icon: "local-gas-station", label: "Nhiên liệu", value: report.fuelLevel != null ? `${report.fuelLevel}%` : "Chưa ghi" },
        ] as const).map(({ icon, label, value }) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.rideInset }]}>
            <View style={styles.statValue}>
              <MaterialIcons name={icon} size={20} color={colors.primary} />
              <Text style={styles.value}>{value}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
          </View>
        ))}
      </View>
      {report.notes ? (
        <View style={styles.notes}>
          <Text style={{ color: colors.onSurfaceVariant }}>Ghi chú</Text>
          <Text>{report.notes}</Text>
        </View>
      ) : null}
      {photos.length ? (
        <View style={styles.gallery}>
          <Text accessibilityRole="header" style={styles.heading}>Ảnh bàn giao</Text>
          <View style={styles.grid}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.cell}>
                <DriverPhoto uri={photo.fileUrl} label={photoAngleLabel(photo.angle)} tile />
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 16 },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  heading: { fontSize: 18, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: 16, gap: 4 },
  statValue: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { flexShrink: 1, fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12 },
  notes: { gap: 4 },
  gallery: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "4%", rowGap: 8 },
  cell: { width: "48%" },
});
