import { AuthApiError } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  typography,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet } from "react-native";

export type SignInMethod = "phone" | "google" | "facebook" | null;

export function SocialButton({
  disabled,
  label,
  loading,
  mark,
  onPress,
}: {
  disabled: boolean;
  label: string;
  loading: boolean;
  mark: string;
  onPress: () => void;
}) {
  const themed_styles = useThemedStyles(styles);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        themed_styles.socialButton,
        disabled && themed_styles.disabledButton,
      ]}
    >
      <Text
        style={[
          themed_styles.socialMark,
          mark === "f" && themed_styles.facebookMark,
        ]}
      >
        {mark}
      </Text>
      <Text style={themed_styles.socialLabel}>
        {loading ? "Đang kết nối..." : label}
      </Text>
    </Pressable>
  );
}

export function isAccountNotFound(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === "ACCOUNT_NOT_FOUND";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("too-many-requests"))
    return "Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.";
  if (code.includes("invalid-phone-number"))
    return "Số điện thoại không hợp lệ.";
  if (code.includes("account-exists-with-different-credential"))
    return "Email này đã được dùng với phương thức đăng nhập khác.";
  return error instanceof Error
    ? error.message
    : "Không thể đăng nhập lúc này. Vui lòng thử lại.";
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.margin,
      paddingVertical: spacing.spaceXl,
    },
    brandIcon: { width: 80, height: 80, alignSelf: "center" },
    brandName: {
      ...typography.labelLg,
      color: colors.primary,
      textAlign: "center",
      marginTop: spacing.spaceSm,
    },
    title: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
      textAlign: "center",
      marginTop: spacing.spaceXl,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: spacing.spaceXs,
      marginBottom: spacing.spaceLg,
    },
    formCard: { gap: spacing.spaceMd, padding: 16 },
    helperText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      marginTop: -spacing.spaceSm,
    },
    errorText: { ...typography.bodyMd, color: colors.error },
    phoneButton: {
      marginTop: spacing.spaceXs,
      backgroundColor: colors.primary,
    },
    phoneButtonText: { color: colors.onPrimary },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      marginVertical: spacing.spaceXs,
    },
    dividerLine: { height: 1, flex: 1, backgroundColor: colors.outlineVariant },
    dividerLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
    socialButton: {
      minHeight: 52,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
      paddingHorizontal: spacing.spaceMd,
    },
    disabledButton: { opacity: 0.6 },
    socialMark: {
      width: 22,
      textAlign: "center",
      fontSize: 20,
      lineHeight: 24,
      color: colors.googleBlue,
      fontWeight: "700",
    },
    facebookMark: { color: colors.facebook },
    socialLabel: { ...typography.labelMd, color: colors.onSurface },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceXs,
      marginTop: spacing.spaceLg,
    },
    footerText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  });
