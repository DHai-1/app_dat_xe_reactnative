import { AuthApiError, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { Image, StyleSheet } from "react-native";
export const googleLogo = require("@/assets/1._ng_nh_p/google.png");

export const facebookLogo = require("@/assets/1._ng_nh_p/facebook.png");

export type SignInMethod = "phone" | "google" | "facebook" | null;

export function SocialButton({
  disabled,
  icon,
  label,
  loading,
  onPress,
}: {
  disabled: boolean;
  icon: number;
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        themed_styles.socialButton,
        pressed && !disabled && themed_styles.socialButtonPressed,
        disabled && themed_styles.disabledButton,
      ]}
    >
      <Image source={icon} style={themed_styles.socialIcon} />
      <Text style={themed_styles.socialLabel}>
        {i18nT(loading ? "Đang kết nối..." : label)}
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
    return i18nT("Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.");
  if (code.includes("invalid-phone-number"))
    return i18nT("Số điện thoại không hợp lệ.");
  if (code.includes("account-exists-with-different-credential"))
    return i18nT("Email này đã được dùng với phương thức đăng nhập khác.");
  return error instanceof Error
    ? error.message
    : i18nT("Không thể đăng nhập lúc này. Vui lòng thử lại.");
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
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceXl,
      paddingBottom: spacing.spaceLg,
    },
    brandLogo: { width: 80, height: 80, marginBottom: spacing.spaceLg },
    heading: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      marginTop: spacing.spaceSm,
      marginBottom: spacing.spaceLg + spacing.spaceSm,
    },
    form: {
      gap: spacing.px3_5,
    },
    helperText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      marginTop: spacing.gap1_5,
    },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
    },
    submitButton: { marginTop: spacing.spaceXs },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1_5,
      marginVertical: spacing.spaceXl,
    },
    dividerLine: {
      height: StyleSheet.hairlineWidth,
      flex: 1,
      backgroundColor: colors.outlineVariant,
    },
    dividerLabel: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
      letterSpacing: spacing.letterSpacingWide,
    },
    socialButton: {
      minHeight: spacing.buttonPillHeight,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
      paddingHorizontal: spacing.spaceMd,
    },
    socialButtonPressed: {
      backgroundColor: colors.surfaceContainerLow,
    },
    disabledButton: { opacity: spacing.disabledOpacity },
    socialIcon: { width: 20, height: 20, resizeMode: "contain" },
    socialLabel: { ...typography.titleMd, color: colors.onSurface },
    footer: {
      marginTop: "auto",
      paddingTop: spacing.spaceXl,
    },
    terms: {
      ...typography.labelSm,
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      lineHeight: 18,
    },
    termsActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 8 },
    termsTarget: { minHeight: 48, minWidth: 48, paddingHorizontal: 8, justifyContent: "center" },
    termsLink: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
