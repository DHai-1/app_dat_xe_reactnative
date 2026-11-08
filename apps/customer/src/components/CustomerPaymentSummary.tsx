import { getLocale, translate as t, type CustomerRideDetail } from "@datxe/shared";
import { Card, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { customerType, MoneyText } from "./CustomerRideUI";

const paymentLabels = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán chưa thành công",
  REFUNDED: "Đã hoàn tiền",
} as const;

export function CustomerPaymentSummary({ ride }: { ride: CustomerRideDetail }) {
  useLanguage();
  const c = useThemeColors();
  const payment = ride.payment;
  const discount = ride.discountAmount ?? 0;
  const cash = payment?.method === "CASH";
  const pendingCash = cash && payment.status === "PENDING" && ride.status === "COMPLETED";
  const paidCash = cash && payment.status === "PAID";
  const amount = payment?.amount ?? ride.finalFare ?? ride.estimatedFare;
  const label = pendingCash ? "Tiền mặt cần trả" : paidCash ? "Tiền mặt đã thanh toán"
    : payment ? "Khoản thanh toán" : ride.finalFare != null ? "Cước chuyến đi" : "Giá dự kiến";
  const tone = payment?.status === "PAID" ? { backgroundColor: c.successContainer, color: c.onSuccessContainer }
    : payment?.status === "FAILED" ? { backgroundColor: c.errorContainer, color: c.onErrorContainer }
    : payment?.status === "PENDING" ? { backgroundColor: c.warningContainer, color: c.onWarningContainer }
    : { backgroundColor: c.surfaceContainerHigh, color: c.onSurface };
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[customerType.meta, { color: c.onSurfaceVariant }]}>{t(label)}</Text>
        {payment ? <Text style={[customerType.meta, styles.badge, tone]}>{t(paymentLabels[payment.status] ?? "Đang cập nhật trạng thái")}</Text> : null}
      </View>
      <MoneyText value={amount} />
      {pendingCash ? <Text style={customerType.address}>{t("Thanh toán cho tài xế khi kết thúc chuyến")}</Text> : null}
      {payment?.paidAt ? (
        <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>{new Date(payment.paidAt).toLocaleString(getLocale())}</Text>
      ) : null}
      {discount > 0 ? (
        <Text style={[customerType.meta, customerType.numbers, { color: c.onSurfaceVariant }]}>
          {t("Giảm giá")} · {t("{0} đ", { "0": discount.toLocaleString(getLocale()) })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
});
