import { AUTH_FULL_NAME_MAX_LENGTH, translate as i18nT } from "@datxe/shared";
import {
  AuthBackButton,
  Button,
  CustomDatePickerModal,
  Input,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  fontSize,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  styles as base_styles,
  genderOptions,
} from "../components/RegisterScreenParts";
import { useRegister } from "../hooks/useRegister";
const pad = (value: number) => String(value).padStart(2, "0");

/** ISO (YYYY-MM-DD) → DD/MM/YYYY để hiển thị. */
function toDisplayDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Date → ISO (YYYY-MM-DD) để lưu và kiểm tra. */
function toIsoDate(date: Date): string {
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDateValue(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export default function RegisterScreen() {
  useLanguage();

  // Trang đăng ký có thể được mở bằng replace từ OTP nên không phải lúc nào cũng có lịch sử back.
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login" as never);
  };

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const maxDate = useMemo(() => new Date(), []);

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    user,
    router,
    phoneParam,
    initialName,
    setFullName,
    initialEmail,
    setEmail,
    dateOfBirth,
    setDateOfBirth,
    gender,
    setGender,
    loading,
    error,
    setError,
    submit,
  } = useRegister();
  if (!user) return null;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <AuthBackButton onPress={leave} />
        <Text accessibilityRole="header" style={styles.title}>
          {i18nT("Hoàn tất đăng ký")}
        </Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <Input
            autoCapitalize="words"
            autoComplete="name"
            label={i18nT("Họ và tên")}
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError("");
            }}
            placeholder={i18nT("Nhập tên của bạn")}
            style={styles.inputSurface}
            defaultValue={initialName}
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={i18nT("Email")}
            maxLength={255}
            onChangeText={(value) => {
              setEmail(value);
              setError("");
            }}
            placeholder={i18nT("Nhập email để tăng cường bảo mật")}
            style={styles.inputSurface}
            defaultValue={initialEmail}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{i18nT("Ngày sinh")}</Text>
            <Pressable
              accessibilityLabel={i18nT("Ngày sinh")}
              accessibilityRole="button"
              onPress={() => setDatePickerVisible(true)}
              style={styles.dateRow}
            >
              <Text
                style={[
                  styles.dateInput,
                  !dateOfBirth && styles.datePlaceholder,
                ]}
              >
                {dateOfBirth ? toDisplayDate(dateOfBirth) : i18nT("Chọn ngày sinh")}
              </Text>
              <MaterialIcons
                color={colors.onSurfaceVariant}
                name="calendar-month"
                size={fontSize.iconLg}
              />
            </Pressable>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{i18nT("Giới tính")}</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: gender === option.value }}
                  onPress={() =>
                    setGender(gender === option.value ? "" : option.value)
                  }
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === option.value && styles.genderOptionTextSelected,
                    ]}
                  >
                    {i18nT(option.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons
              color={colors.primary}
              name="verified-user"
              size={fontSize.iconMd}
            />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>
                {i18nT("Phương thức đăng nhập")}
              </Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {i18nT(
                  user.phoneNumber ??
                    (phoneParam ? String(phoneParam) : user.email) ??
                    "Tài khoản đã xác thực",
                )}
              </Text>
            </View>
          </View>
          {phoneParam && !user.phoneNumber ? (
            <Text style={styles.helperText}>
              {i18nT("Số")} {i18nT(phoneParam)} {i18nT("đã được xác minh.")}
            </Text>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {i18nT(error)}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.legalNotice}>
            {i18nT("Bằng việc Tiếp tục, Tôi đã đọc và đồng ý với")}
            {i18nT(" ")}
            <Text
              accessibilityRole="link"
              onPress={() => router.push("/terms-of-service" as never)}
              style={styles.legalLink}
            >
              {i18nT("Điều khoản sử dụng")}
            </Text>
            {i18nT(" và ")}
            <Text
              accessibilityRole="link"
              onPress={() => router.push("/privacy-policy" as never)}
              style={styles.legalLink}
            >
              {i18nT("Chính sách bảo mật")}
            </Text>
            .
          </Text>
          <Button
            disabled={loading}
            label={i18nT("Xong")}
            loading={loading}
            loadingLabel={i18nT("Đang tạo tài khoản...")}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>

      <CustomDatePickerModal
        maximumDate={maxDate}
        onCancel={() => setDatePickerVisible(false)}
        onConfirm={(date) => {
          setDateOfBirth(toIsoDate(date));
          setError("");
          setDatePickerVisible(false);
        }}
        title={i18nT("Chọn ngày sinh")}
        value={toDateValue(dateOfBirth)}
        visible={datePickerVisible}
      />
    </SafeAreaView>
  );
}
