import { AUTH_FULL_NAME_MAX_LENGTH } from "@datxe/shared";
import {
  Button,
  Card,
  Input,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  fontSize,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, View } from "react-native";

import { styles } from "../components/RegisterScreenParts";
import { useRegister } from "../hooks/useRegister";
export default function DriverRegisterScreen() {
  const colors = useThemeColors();
  const themed_styles = useThemedStyles(styles);

  const {
    user,
    router,
    fullName,
    setFullName,
    phone,
    setPhone,
    code,
    setCode,
    codeSent,
    verifiedPhone,
    loading,
    error,
    setError,
    sendCode,
    verifyCode,
    submit,
  } = useRegister();
  if (!user) return null;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={themed_styles.safeArea}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={themed_styles.backButton}
      >
        <MaterialIcons
          color={colors.onSurface}
          name="arrow-back"
          size={fontSize.iconXl}
        />
      </Pressable>
      <ScrollView
        contentContainerStyle={themed_styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={themed_styles.iconCircle}>
          <MaterialIcons
            color={colors.primary}
            name="local-taxi"
            size={fontSize.icon3xl}
          />
        </View>
        <Text style={themed_styles.title}>Đăng ký đối tác tài xế</Text>
        <Text style={themed_styles.subtitle}>
          Xác minh thông tin để bắt đầu hồ sơ tài xế.
        </Text>

        <Card style={themed_styles.card}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            icon="person"
            label="Họ và tên theo giấy tờ"
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError("");
            }}
            placeholder="Nguyễn Văn An"
            value={fullName}
          />

          {verifiedPhone ? (
            <View style={themed_styles.verifiedRow}>
              <MaterialIcons
                color={colors.primary}
                name="verified"
                size={fontSize.iconMd}
              />
              <Text style={themed_styles.verifiedText}>
                Số điện thoại đã xác minh: {verifiedPhone}
              </Text>
            </View>
          ) : (
            <>
              <Input
                autoComplete="tel"
                editable={!codeSent}
                icon="call"
                keyboardType="phone-pad"
                label="Số điện thoại"
                onChangeText={(value) => {
                  setPhone(value);
                  setError("");
                }}
                placeholder="0912 345 678"
                value={phone}
              />
              {codeSent ? (
                <Input
                  autoComplete="sms-otp"
                  keyboardType="number-pad"
                  label="Mã OTP"
                  maxLength={6}
                  onChangeText={(value) =>
                    setCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Nhập mã 6 chữ số"
                  value={code}
                />
              ) : null}
              <Button
                label={codeSent ? "Xác minh số điện thoại" : "Gửi mã OTP"}
                loading={loading}
                loadingLabel="Đang xác minh..."
                onPress={codeSent ? verifyCode : sendCode}
                style={themed_styles.secondaryButton}
                textStyle={themed_styles.secondaryButtonText}
                variant="tertiary"
              />
            </>
          )}

          {error ? (
            <Text accessibilityRole="alert" style={themed_styles.errorText}>
              {error}
            </Text>
          ) : null}
          <Button
            disabled={!verifiedPhone}
            icon="arrow-forward"
            label="Tạo tài khoản và tiếp tục"
            loading={loading && Boolean(verifiedPhone)}
            loadingLabel="Đang tạo tài khoản..."
            onPress={submit}
            style={themed_styles.submitButton}
          />
          <Text style={themed_styles.note}>
            Sau khi tạo tài khoản, bạn sẽ hoàn tất hồ sơ và tải giấy tờ lái xe
            lên.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
