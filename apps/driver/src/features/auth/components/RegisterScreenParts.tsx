import { AuthApiError } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("invalid-verification-code"))
    return "Mã OTP không đúng. Vui lòng thử lại.";
  if (code.includes("too-many-requests"))
    return "Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.";
  if (code.includes("credential-already-in-use"))
    return "Số điện thoại này đã được liên kết với tài khoản khác.";
  return error instanceof Error
    ? error.message
    : "Không thể tạo tài khoản. Vui lòng thử lại.";
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    backButton: { alignSelf: "flex-start", padding: spacing.spaceMd },
    content: {
      flexGrow: 1,
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingTop: 8,
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceXl,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: colors.primarySoft,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    title: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
      textAlign: "center",
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: spacing.spaceXs,
      marginBottom: 8,
    },
    card: { padding: 16, gap: spacing.spaceMd },
    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      padding: spacing.spaceSm,
      borderRadius: 24,
      backgroundColor: colors.primarySoft,
    },
    verifiedText: { ...typography.labelMd, color: colors.primary, flex: 1 },
    secondaryButton: { marginTop: -spacing.spaceXs },
    secondaryButtonText: { color: colors.onPrimary },
    errorText: { ...typography.bodyMd, color: colors.error },
    submitButton: {
      marginTop: spacing.spaceXs,
      backgroundColor: colors.primary,
    },
    step: { ...typography.labelMd, color: colors.primary, textAlign: "center", marginBottom: 8 },
    note: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
