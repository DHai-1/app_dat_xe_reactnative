import { AuthApiError } from '@datxe/shared';
import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import {
Pressable,
StyleSheet,
Text
} from 'react-native';
export const DRIVER_GREEN = colors.primary;

export type SignInMethod = 'phone' | 'google' | 'facebook' | null;

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
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.socialButton, disabled && styles.disabledButton]}>
      <Text style={[styles.socialMark, mark === 'f' && styles.facebookMark]}>{mark}</Text>
      <Text style={styles.socialLabel}>{loading ? 'Đang kết nối...' : label}</Text>
    </Pressable>
  );
}

export function isAccountNotFound(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === 'ACCOUNT_NOT_FOUND';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('too-many-requests')) return 'Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.';
  if (code.includes('invalid-phone-number')) return 'Số điện thoại không hợp lệ.';
  if (code.includes('account-exists-with-different-credential')) return 'Email này đã được dùng với phương thức đăng nhập khác.';
  return error instanceof Error ? error.message : 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.margin, paddingVertical: spacing.spaceXl },
  brandIcon: { width: 64, height: 64, alignSelf: 'center', borderRadius: borderRadius.xl, backgroundColor: DRIVER_GREEN, alignItems: 'center', justifyContent: 'center' },
  brandLogo: { width: 160, height: 72, alignSelf: 'center', marginBottom: spacing.spaceSm },
  brandName: { ...typography.labelLg, color: DRIVER_GREEN, textAlign: 'center', marginTop: spacing.spaceSm },
  title: { ...typography.headlineXlMobile, color: colors.onSurface, textAlign: 'center', marginTop: spacing.spaceXl },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.spaceXs, marginBottom: spacing.spaceLg },
  formCard: { gap: spacing.spaceMd, padding: spacing.spaceMd },
  helperText: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: -spacing.spaceSm },
  errorText: { ...typography.bodyMd, color: colors.error },
  phoneButton: { marginTop: spacing.spaceXs, minHeight: 56, borderRadius: borderRadius.xl, backgroundColor: DRIVER_GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs },
  phoneButtonText: { ...typography.labelLg, color: colors.onPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, marginVertical: spacing.spaceXs },
  dividerLine: { height: 1, flex: 1, backgroundColor: colors.outlineVariant },
  dividerLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  socialButton: { minHeight: 52, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainerLowest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceSm, paddingHorizontal: spacing.spaceMd },
  disabledButton: { opacity: 0.6 },
  socialMark: { width: 22, textAlign: 'center', fontSize: 20, lineHeight: 24, color: '#4285F4', fontWeight: '700' },
  facebookMark: { color: '#1877F2' },
  socialLabel: { ...typography.labelMd, color: colors.onSurface },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs, marginTop: spacing.spaceLg },
  footerText: { ...typography.labelSm, color: colors.onSurfaceVariant },
});
