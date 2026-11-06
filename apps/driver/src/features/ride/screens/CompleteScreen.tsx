import { DriverPage } from "@/components/DriverPage";
import { rideStyles as s } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { Alert, Image, StyleSheet, View } from "react-native";
import { useComplete } from "../hooks/useComplete";
export default function CompleteRideScreen() {
  const extra = useThemedStyles(extraStyles);

  const themed_s = useThemedStyles(s);
  const { query: q, cash, router, valid } = useComplete(),
    ride = q.data;
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
              #{ride.id} · {ride.status}
            </Text>
            <Text style={themed_s.text}>
              {ride.pickupAddress} → {ride.dropoffAddress}
            </Text>
            {ride.pickupNote ? (
              <Text style={themed_s.text}>
                Ghi chú điểm đón: {ride.pickupNote}
              </Text>
            ) : null}
            <Text style={themed_s.label}>
              {ride.finalFare === null ? "GIÁ DỰ KIẾN" : "CƯỚC CHUYẾN ĐI"}
            </Text>
            <Text style={themed_s.title}>
              {formatMoney(ride.finalFare ?? ride.estimatedFare)}
            </Text>
            {ride.distanceKm !== null ? (
              <Text style={themed_s.text}>{ride.distanceKm} km</Text>
            ) : null}
          </Card>
          {ride.status === "COMPLETED" ? (
            <Card style={themed_s.card}>
              {cash.data?.rideId === ride.id ? (
                <Text style={themed_s.text}>
                  Thanh toán: {cash.data.status} ·{" "}
                  {formatMoney(cash.data.amount)}
                </Text>
              ) : (
                <>
                  <Text style={themed_s.text}>
                    Nếu khách thanh toán bằng tiền mặt, chỉ xác nhận sau khi đã
                    nhận tiền.
                  </Text>
                  <Button
                    disabled={cash.isPending}
                    style={themed_s.button}
                    onPress={() =>
                      Alert.alert(
                        "Xác nhận đã nhận tiền mặt?",
                        "Thao tác ghi nhận thanh toán cho chuyến này.",
                        [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Đã nhận tiền",
                            onPress: () => cash.mutate(),
                          },
                        ],
                      )
                    }
                    label={
                      cash.isPending
                        ? "Đang xác nhận…"
                        : "Xác nhận đã nhận tiền mặt"
                    }
                    textStyle={themed_s.buttonText}
                  />
                </>
              )}
            </Card>
          ) : null}
          {ride.handoverReports.map((report) => (
            <View key={report.id} style={themed_s.card}>
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
                <Image
                  key={photo.id}
                  source={{ uri: photo.fileUrl }}
                  style={extra.item1}
                />
              ))}
            </View>
          ))}
          <Card style={themed_s.card}>
            <Text style={themed_s.title}>Lịch sử trạng thái</Text>
            {ride.statusHistory.map((entry) => (
              <Text key={entry.id} style={themed_s.text}>
                {entry.toStatus} ·{" "}
                {new Date(entry.createdAt).toLocaleString("vi-VN")}
              </Text>
            ))}
          </Card>
        </>
      ) : null}
      <Pressable onPress={() => router.replace("/(tabs)/home")}>
        <Text style={themed_s.link}>Về trang chủ</Text>
      </Pressable>
    </DriverPage>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { height: 180, borderRadius: 12 },
  });
