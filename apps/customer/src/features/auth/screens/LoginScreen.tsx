import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  PhoneNumberInput,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  SocialButton,
  styles as base_styles,
  facebookLogo,
  googleLogo,
} from "../components/LoginScreenParts";
import { useLogin } from "../hooks/useLogin";
export default function LoginScreen() {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    phone,
    setPhone,
    country,
    setCountry,
    busy,
    error,
    setError,
    continueWithPhone,
    continueWithSocial,
  } = useLogin();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text accessibilityRole="header" style={styles.heading}>
            {i18nT("Đồng hành cùng PtitGo")}
          </Text>
          <Text style={styles.subtitle}>
            {i18nT("Đăng nhập hoặc tạo tài khoản PtitGo ngay bây giờ.")}
          </Text>

          <View style={styles.form}>
            <PhoneNumberInput
              country={country}
              disabled={busy !== null}
              onChangeText={(value) => {
                setPhone(value);
                setError("");
              }}
              onSelectCountry={(value) => {
                setCountry(value);
                setPhone((current) => current.slice(0, value.maxLength));
                setError("");
              }}
              placeholder={i18nT("Nhập số điện thoại của bạn")}
              value={phone}
            />
            {error ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {i18nT(error)}
              </Text>
            ) : null}
            <Button
              disabled={busy !== null && busy !== "phone"}
              label={i18nT("Tiếp tục")}
              loading={busy === "phone"}
              loadingLabel={i18nT("Đang gửi mã OTP...")}
              onPress={continueWithPhone}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>{i18nT("HOẶC")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <SocialButton
              disabled={busy !== null}
              icon={googleLogo}
              label={i18nT("Đăng nhập bằng Google")}
              loading={busy === "google"}
              onPress={() => void continueWithSocial("google")}
            />
            <SocialButton
              disabled={busy !== null}
              icon={facebookLogo}
              label={i18nT("Đăng nhập bằng Facebook")}
              loading={busy === "facebook"}
              onPress={() => void continueWithSocial("facebook")}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.terms}>
              {i18nT("Bằng việc Tiếp tục, Tôi đã đọc và đồng ý với")}
              {i18nT(" ")}
              <Text
                accessibilityRole="link"
                onPress={() => router.push("/terms-of-service" as never)}
                style={styles.termsLink}
              >
                {i18nT("Điều khoản sử dụng")}
              </Text>
              {i18nT(" và ")}
              <Text
                accessibilityRole="link"
                onPress={() => router.push("/privacy-policy" as never)}
                style={styles.termsLink}
              >
                {i18nT("Chính sách bảo mật")}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
