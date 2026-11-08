import { CustomerPaymentSummary } from "@/components/CustomerPaymentSummary";
import { CustomerNotice, customerType, RideEndpoints } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { styles as base_styles } from "../components/TripCompletedScreenParts";
import { useTripCompleted } from "../hooks/useTripCompleted";
export default function TripCompletedScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    ride,
    stars,
    setStars,
    comment,
    setComment,
    saving,
    error,
    refresh,
    finish,
  } = useTripCompleted();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Hoàn thành chuyến")}
        backIcon="home"
        backAccessibilityLabel={i18nT("Về trang chủ")}
        onBack={() => router.replace("/(tabs)/home")}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {ride?.status === "COMPLETED" ? (
            <View style={styles.success}>
              <MaterialIcons
                name="check-circle"
                size={54}
                color={colors.successStrong}
              />
              <Text style={styles.heading}>
                {i18nT("Chuyến đi đã hoàn thành")}
              </Text>
            </View>
          ) : null}
          {ride ? (
            <>
              <CustomerPaymentSummary ride={ride} />
              <Card style={styles.card}>
                <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
              </Card>
            </>
          ) : !error ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
          {ride?.status === "COMPLETED" && ride.driverId ? <Card style={styles.card}>
            <Text style={styles.section}>{i18nT("Đánh giá chuyến đi")}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: value === stars }}
                  accessibilityLabel={i18nT(`${value} sao`)}
                  style={[customerType.target, styles.star]}
                  onPress={() => setStars(value)}
                >
                  <MaterialIcons
                    name={value <= stars ? "star" : "star-border"}
                    size={34}
                    color={value <= stars ? colors.onWarningContainer : colors.outline}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              draftValue={comment}
              onChangeText={setComment}
              placeholder={i18nT("Nhận xét (không bắt buộc)")}
              style={styles.input}
              maxLength={2000}
            />
            <Text style={styles.counter}>{i18nT(comment.length)}/2000</Text>
          </Card> : null}
          {ride && ride.status !== "COMPLETED" ? (
            <Text style={styles.error}>
              {i18nT("Chỉ có thể đánh giá chuyến đã hoàn thành.")}
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          {ride?.status === "COMPLETED" && ride.driverId ? <Pressable
            accessibilityRole="button"
            disabled={
              saving || !ride || ride.status !== "COMPLETED" || !ride.driverId
            }
            onPress={() => void finish()}
            style={[
              styles.primary,
              (saving ||
                !ride ||
                ride.status !== "COMPLETED" ||
                !ride.driverId) &&
                styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>{i18nT("Gửi đánh giá")}</Text>
            )}
          </Pressable> : null}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void finish(true)}
            style={styles.skip}
          >
            <Text style={styles.skipText}>{i18nT("Bỏ qua và về trang chủ")}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
