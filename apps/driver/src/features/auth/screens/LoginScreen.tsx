import {
  Button,
  Card,
  Input,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { SocialButton, styles } from "../components/LoginScreenParts";
import { useLogin } from "../hooks/useLogin";
export default function DriverLoginScreen() {
  const router = useRouter();
  const themed_styles = useThemedStyles(styles);

  const {
    setPhone,
    busy,
    error,
    setError,
    continueWithPhone,
    continueWithSocial,
  } = useLogin();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={themed_styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={themed_styles.flex}
      >
        <ScrollView
          contentContainerStyle={themed_styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require("../../../../assets/images/brand-logo.png")}
            accessibilityLabel="PtitGo Tài Xế" accessibilityIgnoresInvertColors
            resizeMode="contain" style={themed_styles.brandIcon} />
          <Text style={themed_styles.brandName}>PtitGo Tài Xế</Text>
          <Text style={themed_styles.title}>Chào mừng đối tác</Text>
          <Text style={themed_styles.subtitle}>
            Đăng nhập để nhận chuyến và bắt đầu hành trình.
          </Text>

          <Card style={themed_styles.formCard}>
            <Input
              accessibilityLabel="Số điện thoại"
              autoComplete="tel"
              editable={busy === null}
              icon="call"
              keyboardType="phone-pad"
              label="Số điện thoại"
              maxLength={16}
              onChangeText={(value) => {
                setPhone(value);
                setError("");
              }}
              placeholder="0912 345 678"
            />
            <Text style={themed_styles.helperText}>
              Xác thực bằng mã OTP gửi qua SMS.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={themed_styles.errorText}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={busy !== null && busy !== "phone"}
              icon="arrow-forward"
              label="Tiếp tục bằng số điện thoại"
              loading={busy === "phone"}
              loadingLabel="Đang gửi mã OTP..."
              onPress={continueWithPhone}
              style={themed_styles.phoneButton}
              textStyle={themed_styles.phoneButtonText}
            />

            <View style={themed_styles.divider}>
              <View style={themed_styles.dividerLine} />
              <Text style={themed_styles.dividerLabel}>Hoặc tiếp tục với</Text>
              <View style={themed_styles.dividerLine} />
            </View>
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Google"
              loading={busy === "google"}
              mark="G"
              onPress={() => void continueWithSocial("google")}
            />
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Facebook"
              loading={busy === "facebook"}
              mark="f"
              onPress={() => void continueWithSocial("facebook")}
            />
          </Card>

          <Button variant="ghost" icon="help-outline" iconPosition="leading" label="Trợ giúp đăng nhập"
            onPress={() => router.push("/(auth)/login-help")} />
          <Button variant="ghost" label="Quyền riêng tư trên ứng dụng" onPress={() => router.push("/settings/privacy")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
