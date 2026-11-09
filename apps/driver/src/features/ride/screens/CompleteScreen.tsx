import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { statusLabel } from "@/lib/displayLabels";
import { formatDistance, formatMoney } from "@datxe/shared";
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
import { HandoverSummary } from "../components/HandoverSummary";
import { RideEarnings } from "../components/RideEarnings";
import { RideRouteCard } from "../components/RideRouteCard";
import { useComplete } from "../hooks/useComplete";
export default function CompleteRideScreen() {
  const [confirmation, setConfirmation] = useState<{ rideId: number; amount: number } | null>(null);

  const themed_s = useThemedStyles(s);
  const colors = useThemeColors();
  const { query: q, cash, router, valid } = useComplete(),
    ride = q.data;
  const payment = ride?.payment;
  const cashToCollect = ride?.status === "COMPLETED" && payment?.method === "CASH"
    && payment.status === "PENDING" && Number.isFinite(payment.amount) && payment.amount >= 0 ? payment.amount : undefined;
  const canConfirmCash = cashToCollect !== undefined;
  const cashCollected = ride?.status === "COMPLETED" && payment?.method === "CASH" && payment.status === "PAID";
  const confirming = confirmation !== null && confirmation.rideId === ride?.id && confirmation.amount === cashToCollect;
  const currentEventId = ride?.statusHistory.findLast((entry) => entry.toStatus === ride.status)?.id;
  return (
    <DriverPage
      title="Chi tiết chuyến"
      appearance="ride"
      footer={canConfirmCash ? (
        <>
          <View style={styles.collection}>
            <Text style={themed_s.label}>Tiền mặt cần thu · Chưa thu</Text>
            <Text style={themed_s.amount}>{formatMoney(cashToCollect)}</Text>
          </View>
          <Button
            label="Xác nhận đã nhận tiền mặt"
            icon="payments"
            iconPosition="leading"
            style={styles.primaryAction}
            loading={cash.isPending}
            loadingLabel="Đang ghi nhận…"
            onPress={() => { if (ride) setConfirmation({ rideId: ride.id, amount: cashToCollect }); }}
          />
        </>
      ) : undefined}
      loading={q.isLoading}
      error={
        !valid ? "Thiếu mã chuyến đi." : q.error?.message || cash.error?.message
      }
      retry={valid ? q.refetch : undefined}
    >
      {ride ? (
        <>
          {ride.status === "COMPLETED" ? (
            <Card style={themed_s.card}>
              <Text accessibilityRole="header" style={themed_s.title}>Thanh toán</Text>
              {cashCollected ? (
                <>
                  <Text style={themed_s.label}>Tiền mặt đã thu</Text>
                  <Text style={themed_s.amount}>{formatMoney(payment.amount)}</Text>
                  <StatusBadge kind="payment" value={payment.status} contextLabel="Thanh toán" />
                </>
              ) : canConfirmCash ? (
                <Text style={themed_s.text}>Chỉ xác nhận sau khi đã nhận tiền mặt từ khách.</Text>
              ) : payment ? (
                <>
                  <StatusBadge kind="payment" value={payment.status} contextLabel="Thanh toán" />
                  <Text style={themed_s.label}>{payment.method === "WALLET" ? "Thanh toán qua ví ứng dụng" : "Khoản thanh toán"}</Text>
                  <Text style={themed_s.amount}>{formatMoney(payment.amount)}</Text>
                </>
              ) : <Text style={themed_s.text}>Chưa tải được thông tin thanh toán. Hãy tải lại trước khi xác nhận.</Text>}
              {payment?.paidAt ? <Text style={themed_s.label}>{new Date(payment.paidAt).toLocaleString("vi-VN")}</Text> : null}
              <Divider style={{ backgroundColor: colors.outlineVariant }} />
              <RideEarnings earnings={ride.driverEarnings} />
            </Card>
          ) : null}
          <Card style={[styles.summary, { backgroundColor: colors.rideSurface }]}>
            <View style={styles.summaryHeader}>
              <Text style={themed_s.label}>Mã chuyến #{ride.id}</Text>
              <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
            </View>
            <View style={styles.fareRow}>
              <View style={styles.fareAmount}>
                <Text style={themed_s.label}>
                  {ride.finalFare === null ? "Cước khách trả dự kiến" : "Cước chuyến đi"}
                </Text>
                <Text style={styles.price}>{formatMoney(ride.finalFare ?? ride.estimatedFare)}</Text>
              </View>
              {ride.distanceKm !== null ? (
                <Text style={[themed_s.label, styles.distance]}>{formatDistance(ride.distanceKm)}</Text>
              ) : null}
            </View>
            {ride.status === "CANCELLED" ? (
              <>
                <Divider style={{ backgroundColor: colors.outlineVariant }} />
                <Text style={themed_s.label}>{ride.cancelledByRole === "CUSTOMER" ? "Khách hủy"
                  : ride.cancelledByRole === "DRIVER" ? "Tài xế hủy"
                  : ride.cancelledByRole === "SYSTEM" ? "Hệ thống hủy" : "Chuyến đã hủy"}</Text>
                {ride.cancelReason ? <Text>{ride.cancelReason}</Text> : null}
              </>
            ) : null}
          </Card>
          <RideRouteCard ride={ride} />
          {ride.handoverReports.map((report) => (
            <HandoverSummary key={report.id} report={report} />
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
            <Button variant="ghost" label="Trợ giúp về chuyến này"
              onPress={() => router.push({ pathname: "/support", params: { rideId: String(ride.id) } })} />
          </GroupedList>
          <DriverConfirmationDialog
            visible={confirming || (cash.isPending && confirmation?.rideId === ride.id)}
            busy={cash.isPending}
            destructive={false}
            disabled={!canConfirmCash}
            title="Xác nhận đã nhận tiền mặt?"
            description={cashToCollect === undefined ? "Chuyến không còn chờ thu tiền mặt."
              : `Xác nhận bạn đã nhận ${formatMoney(cashToCollect)} tiền mặt từ khách.`}
            confirmLabel="Đã nhận tiền"
            dismissLabel="Quay lại"
            error={cash.error?.message}
            onDismiss={() => setConfirmation(null)}
            onConfirm={() => { if (confirming) cash.mutate(undefined, { onSuccess: () => setConfirmation(null) }); }}
          />
        </>
      ) : null}
      {!ride && !q.isLoading ? <Button variant="ghost" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} /> : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  collection: { alignItems: "center", gap: 2 },
  summary: { padding: 20, gap: 16 },
  summaryHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  price: { fontSize: 40, lineHeight: 49, fontWeight: "800", fontVariant: ["tabular-nums"] },
  primaryAction: { minHeight: 52, justifyContent: "center" },
  fareRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  fareAmount: { flex: 1, gap: 4 },
  distance: { flexShrink: 1, textAlign: "right" },
  historyItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  historyText: { flex: 1, paddingBottom: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  timelineLine: { position: "absolute", left: 3, top: 12, bottom: -12, width: 2 },
  currentStatus: { fontWeight: "700" },
});
