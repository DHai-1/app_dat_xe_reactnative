import { chatStatuses } from "@/lib/customerRidePresentation";
import { HandoverGallery } from "@/components/HandoverGallery";
import { CustomerPaymentSummary } from "@/components/CustomerPaymentSummary";
import { CustomerNotice, RideEndpoints } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
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
import { ScrollView, View } from "react-native";

import {
  styles as base_styles,
  statusLabel,
} from "../components/RideDetailScreenParts";
import { useRideDetail } from "../hooks/useRideDetail";
export default function RideDetailScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, ride, error, goBack, refresh, valid } = useRideDetail();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title={i18nT("Chi tiết chuyến")} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {!ride && !error ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={valid ? () => void refresh() : undefined}>{i18nT(error)}</CustomerNotice> : null}
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
            <CustomerPaymentSummary ride={ride} />
            <Card style={styles.card}>
              <Text style={styles.section}>{i18nT("Lộ trình")}</Text>
              <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
              {ride.distanceKm != null ? <Text style={styles.meta}>{ride.distanceKm} km</Text> : null}
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
                  {i18nT("Số km đồng hồ")} · {i18nT(report.odometer.toLocaleString(getLocale()))}{" "}
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
                <HandoverGallery photos={report.photos} />
              </View>
            ))}
            {ride.status === "COMPLETED" ? (
              <Button
                label={i18nT("Xem tổng kết chuyến")}
                onPress={() => router.push({
                  pathname: "/ride/completed",
                  params: { rideId: String(ride.id) },
                })}
              />
            ) : null}
            {!["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(
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
