import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";

import {
  styles as base_styles,
  chatStatuses,
  Row,
  statusLabel,
} from "../components/RideDetailScreenParts";
import { useRideDetail } from "../hooks/useRideDetail";
export default function RideDetailScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, ride, error, goBack } = useRideDetail();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title={i18nT("Chi tiết chuyến")} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {!ride && !error ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.error}>{i18nT(error)}</Text> : null}
        {ride ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.heading}>
                {i18nT("Chuyến #")} {i18nT(ride.id)}
              </Text>
              <Text style={styles.body}>
                {i18nT("Trạng thái:")} {i18nT(statusLabel(ride.status))}
              </Text>
              <Text style={styles.meta}>
                {i18nT(
                  ride.type === "INSTANT"
                    ? "Chuyến ngay"
                    : i18nT("Chuyến đặt lịch{0}", {
                        "0": ride.scheduledAt
                          ? ` · ${new Date(ride.scheduledAt).toLocaleString(getLocale())}`
                          : "",
                      }),
                )}{" "}
                · {i18nT(new Date(ride.createdAt).toLocaleString(getLocale()))}
              </Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Lộ trình")}</Text>
              <Text style={styles.label}>{i18nT("ĐIỂM ĐÓN")}</Text>
              <Text style={styles.body}>
                {ride.pickupAddress || i18nT("Không có địa chỉ")}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.label}>{i18nT("ĐIỂM ĐẾN")}</Text>
              <Text style={styles.body}>
                {ride.dropoffAddress || i18nT("Không có địa chỉ")}
              </Text>
              <Text style={styles.meta}>
                {i18nT(
                  ride.distanceKm === null
                    ? "Khoảng cách chưa có"
                    : `${ride.distanceKm} km`,
                )}
              </Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Thanh toán")}</Text>
              <Row
                label={i18nT("Giá ước tính")}
                value={i18nT("{0} đ", {
                  "0": ride.estimatedFare.toLocaleString(getLocale()),
                })}
              />
              {ride.finalFare !== null ? (
                <Row
                  label={i18nT("Giá cuối cùng")}
                  value={i18nT("{0} đ", {
                    "0": ride.finalFare.toLocaleString(getLocale()),
                  })}
                />
              ) : null}
              {ride.discountAmount ? (
                <Row
                  label={i18nT("Giảm giá")}
                  value={i18nT("{0} đ", {
                    "0": ride.discountAmount.toLocaleString(getLocale()),
                  })}
                />
              ) : null}
            </Card>
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Trạng thái chuyến")}</Text>
              {ride.statusHistory.map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyCopy}>
                    <Text style={styles.body}>
                      {i18nT(statusLabel(entry.toStatus))}
                    </Text>
                    <Text style={styles.meta}>
                      {i18nT(
                        new Date(entry.createdAt).toLocaleString(getLocale()),
                      )}{" "}
                      · {i18nT(entry.actorRole || "SYSTEM")}
                      {i18nT(entry.note ? ` · ${entry.note}` : "")}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
            {ride.handoverReports.map((report) => (
              <View key={report.id} style={styles.card}>
                <Text style={styles.section}>
                  {i18nT("Biên bản")}{" "}
                  {i18nT(report.phase === "PICKUP" ? "nhận xe" : "trả xe")}
                </Text>
                <Text style={styles.meta}>
                  Odometer {i18nT(report.odometer.toLocaleString(getLocale()))}{" "}
                  km
                  {i18nT(
                    report.fuelLevel === null
                      ? ""
                      : i18nT(" · Nhiên liệu {0}%", { "0": report.fuelLevel }),
                  )}
                </Text>
                {report.notes ? (
                  <Text style={styles.body}>{report.notes}</Text>
                ) : null}
                <Text style={styles.meta}>
                  {i18nT(
                    report.confirmedByCustomer
                      ? "Đã được bạn xác nhận"
                      : "Chưa được bạn xác nhận",
                  )}
                </Text>
                <View style={styles.images}>
                  {report.photos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.fileUrl }}
                      style={styles.image}
                    />
                  ))}
                </View>
              </View>
            ))}
            {!["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND", "EXPIRED"].includes(
              ride.status,
            ) ? (
              <Button
                onPress={() =>
                  router.push({
                    pathname: "/ride/tracking",
                    params: { rideId: String(ride.id) },
                  })
                }
                style={styles.primary}
                label={i18nT("Theo dõi chuyến")}
                textStyle={styles.primaryText}
              />
            ) : null}
            {ride.driverId && chatStatuses.includes(ride.status) ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/chat",
                    params: { rideId: String(ride.id) },
                  } as never)
                }
                style={styles.secondary}
              >
                <MaterialIcons name="chat" size={20} color={colors.primary} />
                <Text style={styles.secondaryText}>
                  {i18nT(
                    ride.unreadChatCount > 0
                      ? i18nT("Nhắn tài xế · {0} tin chưa đọc", {
                          "0": ride.unreadChatCount,
                        })
                      : "Nhắn tin với tài xế",
                  )}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
