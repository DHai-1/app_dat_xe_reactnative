import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, View } from "react-native";

import {
  styles as base_styles,
  chatStatuses,
} from "../components/CustomerSupportScreenParts";
import { useCustomerSupport } from "../hooks/useCustomerSupport";
export default function CustomerSupportScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, isSafety, ride, loading, error, retry } =
    useCustomerSupport();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(isSafety ? "An toàn chuyến đi" : "Trợ giúp")}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <MaterialIcons
            name={isSafety ? "shield" : "support-agent"}
            size={32}
            color={colors.primary}
          />
          <Text style={styles.heading}>
            {i18nT(isSafety ? "Công cụ an toàn" : "Trung tâm trợ giúp")}
          </Text>
          <Text style={styles.body}>
            {i18nT(
              isSafety
                ? "Bạn có thể mở theo dõi để xem trạng thái và biên bản chuyến hiện tại."
                : "Bạn có thể tra cứu chuyến, trạng thái và lịch sử trực tiếp từ dữ liệu tài khoản.",
            )}
          </Text>
        </View>
        {error ? (
          <Pressable onPress={() => void retry()}>
            <Text style={styles.body}>{i18nT(error)}</Text>
            <Text style={styles.linkText}>{i18nT("Thử lại")}</Text>
          </Pressable>
        ) : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : ride ? (
          <>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/ride/tracking",
                  params: { rideId: String(ride.id) },
                })
              }
              style={styles.ride}
            >
              <Text style={styles.label}>{i18nT("CHUYẾN ĐANG HOẠT ĐỘNG")}</Text>
              <Text style={styles.body}>
                #{i18nT(ride.id)} · {i18nT(ride.status)}
              </Text>
              <Text style={styles.meta}>
                {ride.pickupAddress || i18nT("Điểm đón")} →{" "}
                {ride.dropoffAddress || i18nT("Điểm đến")}
              </Text>
            </Pressable>
            {ride.driverId && chatStatuses.includes(ride.status) ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/chat",
                    params: { rideId: String(ride.id) },
                  } as never)
                }
                style={styles.chat}
              >
                <MaterialIcons name="chat" size={20} color={colors.primary} />
                <Text style={styles.chatText}>
                  {i18nT("Nhắn tin với tài xế")}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : !error ? (
          <Text style={styles.meta}>
            {i18nT("Hiện không có chuyến đang hoạt động.")}
          </Text>
        ) : null}
        <Card style={styles.card}>
          <Text style={styles.section}>{i18nT("Quản lý chuyến")}</Text>
          <Text style={styles.body}>
            {i18nT(
              "Mở Lịch sử để xem chi tiết, trạng thái, giá và biên bản bàn giao của chuyến.",
            )}
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/history")}
            style={styles.link}
          >
            <Text style={styles.linkText}>{i18nT("Mở lịch sử chuyến đi")}</Text>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
