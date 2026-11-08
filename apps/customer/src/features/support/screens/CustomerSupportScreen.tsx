import { CustomerNotice, customerType, RideEndpoints } from "@/components/CustomerRideUI";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useSupportRequests } from "@/lib/useSupportRequests";
import { pickSupportImage } from "@/lib/supportImages";
import { translate as t, type CustomerRideDetail } from "@datxe/shared";
import { Button, Card, ScreenWrapper, SupportCenter, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet } from "react-native";
import { useCustomerSupport } from "../hooks/useCustomerSupport";
import { rideStatusLabel, chatStatuses } from "@/lib/customerRidePresentation";

export default function CustomerSupportScreen() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  return topic === "safety" ? <CustomerSafety /> : <CustomerHelp />;
}

function CustomerHelp() {
  useLanguage();
  const support = useSupportRequests();
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  return (
    <ScreenWrapper>
      <ScreenHeader title={t("Trợ giúp")} onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <SupportCenter
            {...support}
            initialRideId={Number(rideId) || undefined}
            pickImage={pickSupportImage}
            onRefresh={() => void support.retry()}
            onOpenSafety={() => router.push({ pathname: "/support", params: { topic: "safety", rideId } })}
            onOpenRide={(id) => router.push({ pathname: "/ride/[id]", params: { id: String(id), returnTo: "home" } })}
          />
          <Button variant="secondary" label="Mở lịch sử chuyến đi" onPress={() => router.push("/(tabs)/history")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function CustomerSafety() {
  useLanguage();
  const c = useThemeColors();
  const { router, ride, error, retry } = useCustomerSupport();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const [callError, setCallError] = useState(false);
  const openPhone = async () => {
    setCallError(false);
    try {
      await Linking.openURL("tel:112");
    } catch {
      setCallError(true);
    }
  };
  return (
    <ScreenWrapper>
      <ScreenHeader title={t("An toàn chuyến đi")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text accessibilityRole="header" style={customerType.heading}>{t("Hỗ trợ khẩn cấp tại Việt Nam")}</Text>
          <Text style={customerType.address}>{t("Nếu đang gặp tình huống nguy cấp, liên hệ tổng đài khẩn cấp quốc gia và cho biết vị trí của bạn.")}</Text>
          <Button label="Mở điện thoại · 112" icon="call" iconPosition="leading"
            style={{ backgroundColor: c.error }} contentColor={c.onError} onPress={() => void openPhone()} />
        </Card>
        {callError ? <CustomerNotice>{t("Chưa mở được ứng dụng điện thoại. Hãy quay số 112 trên điện thoại tại Việt Nam.")}</CustomerNotice> : null}
        {error ? <CustomerNotice onRetry={() => void retry()}>{t(error)}</CustomerNotice> : null}
        {ride && (!rideId || String(ride.id) === rideId) ? <ActiveRideSafety ride={ride} /> : null}
        <Button variant="secondary" label="Trợ giúp về chuyến đi"
          onPress={() => router.push({ pathname: "/support", params: { rideId: rideId || (ride ? String(ride.id) : undefined) } })} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function ActiveRideSafety({ ride }: { ride: CustomerRideDetail }) {
  const router = useRouter();
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={customerType.heading}>{t(rideStatusLabel[ride.status] ?? "Đang cập nhật trạng thái")}</Text>
      <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
      <Button variant="secondary" label="Theo dõi chuyến"
        onPress={() => router.push({ pathname: "/ride/tracking", params: { rideId: String(ride.id) } })} />
      {ride.driverId && chatStatuses.includes(ride.status) ? (
        <Button variant="secondary" label="Nhắn tin với tài xế" onPress={() => router.push({ pathname: "/chat", params: { rideId: String(ride.id) } })} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: { padding: 20, gap: 12 },
});
