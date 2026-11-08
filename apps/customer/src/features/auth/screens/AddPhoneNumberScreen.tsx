import { translate as i18nT, toInternationalPhoneNumber } from "@datxe/shared";
import {
  AuthBackButton,
  AuthHero,
  Button,
  Card,
  OtpCodeInput,
  PhoneNumberInput,
  MotionPressable as Pressable,
  ResendOtpButton,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { styles as base_styles } from "../components/AddPhoneNumberScreenParts";
import { useAddPhoneNumber } from "../hooks/useAddPhoneNumber";
export default function AddPhoneNumberScreen() {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const {
    user,
    router,
    accountProvider,
    country,
    setCountry,
    initialPhone,
    otp,
    setOtp,
    otpStep,
    invalid,
    setInvalid,
    submitting,
    error,
    setError,
    notice,
    setNotice,
    onChangePhone,
    onSubmit,
    resendCode,
    switchAccount,
    changePhone,
  } = useAddPhoneNumber();
  if (!user) return null;
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <AuthBackButton
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(auth)/login" as never)
            }
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero
            detail={
              otpStep ? toInternationalPhoneNumber(initialPhone, country) : undefined
            }
            icon={otpStep ? "sms" : "phone-android"}
            subtitle={i18nT(
              otpStep
                ? "Nhập mã xác thực 6 chữ số vừa được gửi qua SMS."
                : "Liên kết số điện thoại đã xác thực với tài khoản khách hàng của bạn.",
            )}
            title={i18nT(
              otpStep ? "Xác thực số điện thoại" : "Thêm số điện thoại",
            )}
          />

          <View style={styles.connectedPill}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>
              {i18nT("Tài khoản")} {i18nT(accountProvider)}{" "}
              {i18nT("đã kết nối")}
            </Text>
          </View>

          <Card style={styles.formCard}>
            {!otpStep ? (
              <>
                <PhoneNumberInput
                  country={country}
                  disabled={submitting}
                  invalid={invalid}
                  label={i18nT("Số điện thoại nhận OTP")}
                  onChangeText={onChangePhone}
                  onSelectCountry={(value) => {
                    setCountry(value);
                    setInvalid(false);
                    setError("");
                    setNotice("");
                  }}
                  defaultValue={initialPhone}
                />
                <Text style={styles.helperText}>
                  {i18nT("Chúng tôi sẽ gửi mã xác thực qua SMS.")}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>
                  {i18nT("Mã OTP gồm 6 chữ số")}
                </Text>
                <OtpCodeInput
                  autoFocus
                  disabled={submitting}
                  onChange={(value) => {
                    setOtp(value);
                    setError("");
                    setNotice("");
                  }}
                  value={otp}
                />
                <Text style={styles.helperText}>
                  {i18nT(
                    "Bạn có thể dán mã OTP hoặc chọn mã được gợi ý từ SMS.",
                  )}
                </Text>
              </>
            )}

            {error ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {i18nT(error)}
              </Text>
            ) : null}
            {notice ? (
              <Text style={styles.noticeText}>{i18nT(notice)}</Text>
            ) : null}

            <Button
              disabled={submitting}
              icon="arrow-forward"
              label={i18nT(otpStep ? "Xác nhận và liên kết số" : "Gửi mã OTP")}
              loading={submitting}
              loadingLabel={i18nT(
                otpStep ? "Đang xác thực..." : "Đang gửi mã...",
              )}
              onPress={() => void onSubmit()}
              style={styles.submitButton}
            />

            {otpStep ? (
              <>
                <ResendOtpButton disabled={submitting} onResend={resendCode} />
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={changePhone}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    {i18nT("Đổi số điện thoại")}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </Card>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => void switchAccount()}
            style={styles.switchAccount}
          >
            <Text style={styles.switchAccountText}>
              {i18nT("Đăng nhập bằng tài khoản khác")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
