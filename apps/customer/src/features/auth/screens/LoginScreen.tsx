import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  MotionPressable as Pressable,
  PhoneNumberInput,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

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
          <Image source={require("../../../../assets/images/brand-logo.png")}
            accessibilityLabel="PtitGo" accessibilityIgnoresInvertColors
            resizeMode="contain" style={styles.brandLogo} />
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
                setError("");
              }}
              placeholder={i18nT("Nhập số điện thoại của bạn")}
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
              {i18nT("Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.")}
            </Text>
            <View style={styles.termsActions}>
              <Pressable accessibilityRole="link" style={styles.termsTarget} onPress={() => router.push("/terms-of-service")}>
                <Text style={styles.termsLink}>{i18nT("Điều khoản sử dụng")}</Text>
              </Pressable>
              <Pressable accessibilityRole="link" style={styles.termsTarget} onPress={() => router.push("/privacy-policy")}>
                <Text style={styles.termsLink}>{i18nT("Chính sách bảo mật")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
