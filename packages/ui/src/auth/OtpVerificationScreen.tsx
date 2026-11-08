import { translate as i18nT } from "@datxe/shared";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
} from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import {
  AuthApiError,
  authenticateWithBackend,
  confirmPhoneCode,
  normalizeVietnamPhoneNumber,
  sendPhoneCode,
  type AuthRole,
} from "@datxe/shared";
import { Button } from "../components/Button";
import { spacing, typography } from "../theme/colors";
import { AuthBackButton } from "./AuthBackButton";
import { OtpCodeInput } from "./OtpCodeInput";
import { ResendOtpButton } from "./ResendOtpButton";

type Props = {
  role: AuthRole;
  phone: string;
  onLogin: () => void;
  onRegister: (phone: string) => void;
  onHome: () => void;
  onHelp?: () => void;
};

export function OtpVerificationScreen({
  role,
  phone,
  onLogin,
  onRegister,
  onHome,
  onHelp,
}: Props) {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Gửi lại OTP qua Firebase (API thật), có timeout để không treo UI nếu SDK không phản hồi.
  const handleResend = async () => {
    if (resending) return false;
    setResending(true);
    setError("");
    setNotice("");
    try {
      await withTimeout(sendPhoneCode(phone), RESEND_TIMEOUT_MS);
      setCode("");
      setNotice(i18nT("Đã gửi lại mã OTP mới."));
      return true;
    } catch (cause) {
      setError(getErrorMessage(cause));
      return false;
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (code.replace(/\D/g, "").length !== 6) {
      setError(i18nT("Vui lòng nhập đủ 6 chữ số OTP."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await confirmPhoneCode(code);
      try {
        const profile = await authenticateWithBackend(role, user);
        if (profile.role !== role.toUpperCase()) {
          throw new AuthApiError(
            i18nT("Tài khoản này không thuộc ứng dụng đang sử dụng."),
            "ROLE_MISMATCH",
          );
        }
        onHome();
      } catch (cause) {
        if (isAccountNotFound(cause)) {
          onRegister(normalizeVietnamPhoneNumber(phone));
          return;
        }
        throw cause;
      }
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <AuthBackButton onPress={onLogin} />
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text accessibilityRole="header" style={styles.heading}>
            {i18nT("Nhập mã OTP")}
          </Text>
          <Text style={styles.description}>
            {i18nT("Nhập mã gồm 6 chữ số được gửi đến số")}{" "}
            <Text style={styles.phone}>
              {normalizeVietnamPhoneNumber(phone)}
            </Text>{" "}
            {i18nT("thông qua SMS.")}
          </Text>

          <View style={styles.codeBlock}>
            <OtpCodeInput
              autoFocus
              disabled={loading}
              onChange={(value) => {
                setCode(value);
                setError("");
              }}
              value={code}
            />
            <View style={styles.resend}>
              <ResendOtpButton
                disabled={loading || resending}
                onResend={handleResend}
              />
            </View>
          </View>

          {error ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {i18nT(error)}
            </Text>
          ) : notice ? (
            <Text accessibilityRole="alert" style={styles.noticeText}>
              {i18nT(notice)}
            </Text>
          ) : null}
          {onHelp ? <Button variant="ghost" label={i18nT("Chưa nhận được mã?")} onPress={onHelp} /> : null}
          <Pressable accessibilityRole="button" disabled={loading} onPress={onLogin} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{i18nT("Đổi số điện thoại")}</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            disabled={loading || resending || code.replace(/\D/g, "").length !== 6}
            label={i18nT("Xác nhận OTP")}
            loading={loading}
            loadingLabel={i18nT("Đang xác thực...")}
            onPress={() => void handleVerify()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const RESEND_TIMEOUT_MS = 20000;

/** Bọc lời gọi Firebase bằng timeout để nút gửi lại không bị treo vô hạn. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new AuthApiError(
            i18nT("Không gửi lại được mã OTP. Kiểm tra kết nối rồi thử lại."),
            "RESEND_TIMEOUT",
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (cause) => {
        clearTimeout(timer);
        reject(cause);
      },
    );
  });
}

function isAccountNotFound(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === "ACCOUNT_NOT_FOUND";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("invalid-verification-code"))
    return i18nT("Mã OTP không đúng. Vui lòng thử lại.");
  if (code.includes("session-expired"))
    return i18nT("Mã OTP đã hết hạn. Hãy gửi lại mã mới.");
  if (code.includes("too-many-requests"))
    return i18nT("Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.");
  return error instanceof Error
    ? error.message
    : i18nT("Không thể xác thực lúc này. Vui lòng thử lại.");
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceXs,
      minHeight: spacing.headerHeight,
    },
    topBarSpacer: { width: spacing.iconButtonMd },
    content: {
      flexGrow: 1,
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceSm,
    },
    heading: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
    },
    description: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      marginTop: spacing.spaceSm,
      lineHeight: 21,
    },
    phone: {
      ...typography.bodyMd,
      fontWeight: "700",
      color: colors.onSurface,
    },
    codeBlock: {
      marginTop: spacing.spaceLg + spacing.spaceSm,
      gap: spacing.spaceMd,
    },
    resend: { paddingTop: 36 },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
      marginTop: spacing.spaceMd,
    },
    noticeText: {
      ...typography.bodyMd,
      color: colors.verified,
      marginTop: spacing.spaceMd,
    },
    footer: {
      paddingTop: spacing.spaceSm,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceSm,
      gap: spacing.spaceXs,
    },
    secondaryAction: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
  });
