import { AuthApiError } from '@datxe/shared';
import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import { StyleSheet } from 'react-native';
export const DRIVER_GREEN = colors.primary;

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-verification-code')) return 'Mã OTP không đúng. Vui lòng thử lại.';
  if (code.includes('too-many-requests')) return 'Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.';
  if (code.includes('credential-already-in-use')) return 'Số điện thoại này đã được liên kết với tài khoản khác.';
  return error instanceof Error ? error.message : 'Không thể tạo tài khoản. Vui lòng thử lại.';
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backButton: { alignSelf: 'flex-start', padding: spacing.spaceMd },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.margin, paddingBottom: spacing.spaceXl },
  iconCircle: { width: 72, height: 72, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixedTint, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.spaceLg },
  brandLogo: { width: 160, height: 72, alignSelf: 'center', marginBottom: spacing.spaceLg },
  title: { ...typography.headlineXlMobile, color: colors.onSurface, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.spaceXs, marginBottom: spacing.spaceLg },
  card: { padding: spacing.spaceMd, gap: spacing.spaceMd },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, padding: spacing.spaceSm, borderRadius: borderRadius.lg, backgroundColor: colors.primaryFixedTint },
  verifiedText: { ...typography.labelMd, color: DRIVER_GREEN, flex: 1 },
  secondaryButton: { marginTop: -spacing.spaceXs, minHeight: 56, borderRadius: borderRadius.xl, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.onPrimary },
  errorText: { ...typography.bodyMd, color: colors.error },
  submitButton: { marginTop: spacing.spaceXs, minHeight: 56, borderRadius: borderRadius.xl, backgroundColor: DRIVER_GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs },
  submitButtonText: { ...typography.labelLg, color: colors.onPrimary },
  disabledButton: { opacity: 0.5 },
  note: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
});
