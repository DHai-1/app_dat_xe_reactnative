import { rideStyles as s } from "@/components/rideStyles";
import { openExternalDirections } from "@/lib/navigation";
import { formatMoney } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";

import { useAccept } from "../hooks/useAccept";
export default function AcceptRideScreen() {
  const extra = useThemedStyles(extraStyles);

  const themed_s = useThemedStyles(s);

  const h = useAccept();
  return (
    <SafeAreaView style={themed_s.safe}>
      <ScrollView contentContainerStyle={themed_s.page}>
        <Pressable onPress={() => h.router.back()}>
          <Text style={themed_s.link}>‹ Quay lại</Text>
        </Pressable>
        <Text style={themed_s.title}>Yêu cầu chuyến đi</Text>
        {h.loading ? <ActivityIndicator /> : null}
        {h.error ? <Text style={themed_s.error}>{h.error}</Text> : null}
        {h.offer ? (
          <>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>
                ĐIỂM ĐÓN · {h.offer.customer.displayName}
              </Text>
              <Text style={themed_s.text}>{h.offer.pickup.address}</Text>
              <Text style={themed_s.label}>GHI CHÚ ĐIỂM ĐÓN</Text>
              <Text style={themed_s.text}>
                {h.offer.pickupNote || "Khách chưa thêm ghi chú điểm đón."}
              </Text>
              <Pressable
                onPress={() => void openExternalDirections(h.offer!.pickup)}
              >
                <Text style={themed_s.link}>Mở chỉ đường tới điểm đón ↗</Text>
              </Pressable>
            </Card>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>ĐIỂM TRẢ</Text>
              <Text style={themed_s.text}>{h.offer.dropoff.address}</Text>
              <Text style={themed_s.text}>
                {h.offer.tripDistanceKm} km · {h.offer.estDurationMin} phút
              </Text>
              <Text style={themed_s.text}>
                {h.offer.vehicle.type} · {h.offer.vehicle.transmission}
              </Text>
              <Text style={themed_s.title}>
                {formatMoney(h.offer.fareEstimate)}
              </Text>
              {h.offer.note ? (
                <Text style={themed_s.text}>{h.offer.note}</Text>
              ) : null}
            </Card>
            <Pressable
              disabled={h.busy || !h.secondsLeft}
              onPress={h.accept}
              style={[
                themed_s.button,
                (h.busy || !h.secondsLeft) && extra.item1,
              ]}
            >
              <Text style={themed_s.buttonText}>
                {h.busy
                  ? "Đang xử lý…"
                  : h.secondsLeft
                    ? `Nhận chuyến (${h.secondsLeft}s)`
                    : "Yêu cầu đã hết hạn"}
              </Text>
            </Pressable>
            <Pressable disabled={h.busy} onPress={h.reject}>
              <Text style={themed_s.link}>Bỏ qua yêu cầu</Text>
            </Pressable>
          </>
        ) : !h.loading ? (
          <Card style={themed_s.card}>
            <Text style={themed_s.text}>
              Chưa có yêu cầu chuyến đi đang chờ.
            </Text>
            <Pressable onPress={() => void h.refresh()}>
              <Text style={themed_s.link}>Tải lại</Text>
            </Pressable>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { opacity: 0.4 },
  });
