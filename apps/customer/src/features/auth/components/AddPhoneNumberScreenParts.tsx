import { AuthApiError, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export function getPhoneError(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("invalid-phone-number"))
    return i18nT("Số điện thoại không hợp lệ.");
  if (
    code.includes("phone-number-already-in-use") ||
    code.includes("credential-already-in-use")
  )
    return i18nT("Số điện thoại này đã gắn với một tài khoản khác.");
  if (code.includes("invalid-verification-code"))
    return i18nT("Mã OTP không đúng. Vui lòng thử lại.");
  if (code.includes("session-expired"))
    return i18nT("Mã OTP đã hết hạn. Hãy gửi lại mã mới.");
  if (code.includes("too-many-requests"))
    return i18nT("Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.");
  return error instanceof Error
    ? error.message
    : i18nT("Không thể xác minh số điện thoại. Vui lòng thử lại.");
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: { paddingHorizontal: spacing.margin, paddingTop: spacing.spaceXs },
    content: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingHorizontal: spacing.margin,
      paddingVertical: spacing.spaceLg,
    },
    connectedPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
      paddingHorizontal: spacing.spaceMd,
      paddingVertical: spacing.spaceXs,
      borderRadius: 999,
      backgroundColor: colors.secondaryContainer,
      marginTop: -spacing.spaceSm,
      marginBottom: spacing.spaceMd,
    },
    connectedDot: {
      width: spacing.statusDot,
      height: spacing.statusDot,
      borderRadius: 999,
      backgroundColor: colors.success,
    },
    connectedText: { ...typography.labelSm, color: colors.onSecondaryFixed },
    formCard: {
      width: "100%",
      alignItems: "stretch",
      gap: spacing.spaceMd,
      padding: 16,
      borderRadius: 24,
    },
    fieldLabel: { ...typography.labelLg, color: colors.onSurface },
    helperText: { ...typography.labelSm, color: colors.onSurfaceVariant },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
      textAlign: "center",
    },
    noticeText: {
      ...typography.labelSm,
      color: colors.successStrong,
      textAlign: "center",
    },
    submitButton: { width: "100%" },
    secondaryAction: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.spaceMd,
    },
    secondaryActionText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
    switchAccount: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.spaceMd,
      marginTop: spacing.spaceSm,
    },
    switchAccountText: { ...typography.labelMd, color: colors.primary },
  });
