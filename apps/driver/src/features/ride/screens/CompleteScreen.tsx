import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { DriverPhoto } from "@/components/DriverPhoto";
import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { statusLabel } from "@/lib/displayLabels";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  GroupedList,
  SectionHeading,
  Typography as Text,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { Divider } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { useState } from "react";
import { photoAngleLabel } from "../photoAngles";
import { useComplete } from "../hooks/useComplete";
export default function CompleteRideScreen() {
  const [confirmCash, setConfirmCash] = useState(false);

  const themed_s = useThemedStyles(s);
  const colors = useThemeColors();
  const { query: q, cash, router, valid } = useComplete(),
    ride = q.data;
  const currentEventId = ride?.statusHistory.findLast((entry) => entry.toStatus === ride.status)?.id;
  return (
    <DriverPage
      title="Chi tiết chuyến"
      loading={q.isLoading}
      error={
        !valid ? "Thiếu mã chuyến đi." : q.error?.message || cash.error?.message
      }
      retry={valid ? q.refetch : undefined}
    >
      {ride ? (
        <>
          <Card style={themed_s.card}>
            <Text style={themed_s.label}>
              Mã chuyến #{ride.id}
            </Text>
            <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
            <Text style={themed_s.text}>Đón · {ride.pickupAddress ?? "Chưa có địa chỉ"}</Text>
            <Text style={themed_s.text}>Trả · {ride.dropoffAddress ?? "Chưa có địa chỉ"}</Text>
            {ride.status === "CANCELLED" ? (
              <>
                <Text style={themed_s.label}>{ride.cancelledByRole === "CUSTOMER" ? "Khách hủy"
                  : ride.cancelledByRole === "DRIVER" ? "Tài xế hủy"
                  : ride.cancelledByRole === "SYSTEM" ? "Hệ thống hủy" : "Chuyến đã hủy"}</Text>
                {ride.cancelReason ? <Text>{ride.cancelReason}</Text> : null}
              </>
            ) : null}
            {ride.pickupNote ? (
              <Text style={themed_s.text}>
                Ghi chú điểm đón: {ride.pickupNote}
              </Text>
            ) : null}
            <Divider style={{ backgroundColor: colors.outlineVariant }} />
            <View style={styles.fareRow}>
              <View style={styles.fareAmount}>
                <Text style={themed_s.label}>
                  {ride.finalFare === null ? "Cước khách trả dự kiến" : "Cước chuyến đi"}
                </Text>
                <Text style={themed_s.title}>{formatMoney(ride.finalFare ?? ride.estimatedFare)}</Text>
              </View>
              {ride.distanceKm !== null ? (
                <Text style={[themed_s.text, styles.distance]}>{ride.distanceKm} km</Text>
              ) : null}
            </View>
          </Card>
          {ride.status === "COMPLETED" ? (
            <Card style={themed_s.card}>
              <Text style={themed_s.title}>Thanh toán</Text>
              {ride.payment ? <Text style={themed_s.text}>Khoản thanh toán · {formatMoney(ride.payment.amount)}</Text> : null}
              {ride.payment?.status === 'PAID' ? (
                <>
                  <StatusBadge kind="payment" value={ride.payment.status} contextLabel="Thanh toán" />
                  {ride.payment.paidAt ? <Text style={themed_s.label}>{new Date(ride.payment.paidAt).toLocaleString('vi-VN')}</Text> : null}
                </>
              ) : ride.payment?.method === 'CASH' && ride.payment.status === 'PENDING' ? (
                <>
                  <Text style={themed_s.text}>
                    Nếu khách thanh toán bằng tiền mặt, chỉ xác nhận sau khi đã
                    nhận tiền.
                  </Text>
                  <Button label="Xác nhận đã nhận tiền mặt" loading={cash.isPending} onPress={() => setConfirmCash(true)} />
                </>
              ) : ride.payment ? <>
                <StatusBadge kind="payment" value={ride.payment.status} contextLabel="Thanh toán" />
                <Text style={themed_s.text}>Thanh toán được xử lý theo phương thức của chuyến.</Text>
              </> : <Text style={themed_s.text}>Chưa tải được thông tin thanh toán. Hãy tải lại trước khi xác nhận.</Text>}
            </Card>
          ) : null}
          {ride.handoverReports.map((report) => (
            <Card key={report.id} style={themed_s.card}>
              <Text style={themed_s.title}>
                Biên bản {report.phase === "PICKUP" ? "nhận xe" : "trả xe"}
              </Text>
              <Text style={themed_s.text}>
                {report.odometer} km ·{" "}
                {report.confirmedByCustomer
                  ? "Khách đã xác nhận"
                  : "Chờ khách xác nhận"}
              </Text>
              {report.notes ? (
                <Text style={themed_s.text}>{report.notes}</Text>
              ) : null}
              {report.photos.map((photo) => (
                <DriverPhoto key={photo.id} uri={photo.fileUrl} label={photoAngleLabel(photo.angle)} />
              ))}
            </Card>
          ))}
          {ride.statusHistory.length ? (
            <View>
              <SectionHeading title="Mốc chuyến đi" />
              <Card>
                {ride.statusHistory.map((entry, index) => {
                  const current = entry.id === currentEventId;
                  const label = statusLabel("ride", entry.toStatus).label;
                  return (
                    <View key={entry.id} style={styles.historyItem}>
                      {index < ride.statusHistory.length - 1 ? (
                        <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                      ) : null}
                      <View style={[styles.timelineDot, { backgroundColor: current ? colors.primary : colors.outline }]} />
                      <View style={styles.historyText}>
                        <Text
                          style={[themed_s.text, current && styles.currentStatus]}
                          accessibilityLabel={current ? `Trạng thái hiện tại: ${label}` : label}
                        >
                          {label}
                        </Text>
                        <Text style={themed_s.label}>{new Date(entry.createdAt).toLocaleString("vi-VN")}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>
          ) : null}
          <GroupedList title="Tra cứu và hỗ trợ">
            <Button variant="ghost" label="Xem thu nhập đã ghi nhận" onPress={() => router.push("/profile/wallet" as never)} />
            <Button variant="ghost" label="Trợ giúp về chuyến này"
              onPress={() => router.push({ pathname: "/support", params: { rideId: String(ride.id) } } as never)} />
          </GroupedList>
          <DriverConfirmationDialog
            visible={confirmCash}
            busy={cash.isPending}
            destructive={false}
            disabled={ride.status !== "COMPLETED" || ride.payment?.method !== "CASH" || ride.payment.status !== "PENDING"}
            title="Xác nhận đã nhận tiền mặt?"
            description="Thao tác ghi nhận thanh toán cho chuyến này."
            confirmLabel="Đã nhận tiền"
            dismissLabel="Quay lại"
            error={cash.error?.message}
            onDismiss={() => setConfirmCash(false)}
            onConfirm={() => cash.mutate(undefined, { onSuccess: () => setConfirmCash(false) })}
          />
        </>
      ) : null}
      {!ride && !q.isLoading ? <Button variant="ghost" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} /> : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  fareRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  fareAmount: { flex: 1, gap: 4 },
  distance: { flexShrink: 1, textAlign: "right" },
  historyItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  historyText: { flex: 1, paddingBottom: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  timelineLine: { position: "absolute", left: 3, top: 12, bottom: -12, width: 2 },
  currentStatus: { fontWeight: "700" },
});
