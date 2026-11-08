import type { PaymentMethod } from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import { spacing, typography, useThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";
export function countLabel(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(getLocale()).format(value);
}

export function getPaymentMethodLabel(method: PaymentMethod | null): string {
  if (method === "CASH") return i18nT("Tiền mặt");
  if (method === "WALLET") return i18nT("Ví");
  if (method === "VNPAY") return "VNPay";
  if (method === "MOMO") return "MoMo";
  return i18nT("Chưa thiết lập");
}

export function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : i18nT("Không tải được dữ liệu từ máy chủ.");
}

export const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceLg,
      paddingBottom: spacing.spaceXl,
      gap: 16,
    },
    identityCard: {
      gap: 16,
      padding: 16,
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    editButton: {
      margin: 0,
      width: 48,
      height: 48,
      borderRadius: 999,
      flexShrink: 0,
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceContainerHigh,
    },
    identityDivider: { backgroundColor: colors.outlineSubtle },
    avatarWrap: {
      flexShrink: 0,
      position: "relative",
    },
    avatar: {
      width: spacing.profileAvatar,
      height: spacing.profileAvatar,
      borderRadius: 999,
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryContainer,
    },
    avatarInitials: {
      ...typography.headlineSm,
      color: colors.primary,
      textAlign: "center",
      includeFontPadding: false,
    },
    avatarEditBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 26,
      height: 26,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    loadErrorBox: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.errorContainer,
    },
    loadErrorText: {
      ...typography.bodyMd,
      color: colors.error,
    },
    retryText: {
      ...typography.labelMd,
      color: colors.error,
      marginTop: spacing.py1,
    },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
      marginTop: spacing.spaceSm,
    },
    editDialogCard: {
      width: "100%",
      maxWidth: spacing.modalMaxWidth,
      maxHeight: "88%",
      alignSelf: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 24,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 16,
      gap: spacing.spaceMd,
    },
    editLabel: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
      marginTop: spacing.spaceSm,
      marginBottom: spacing.py1,
    },
    dialogHint: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    editInput: {
      minHeight: spacing.buttonHeight,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 24,
      paddingHorizontal: spacing.spaceSm,
      color: colors.onSurface,
      backgroundColor: colors.surface,
    },
    editChoices: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.spaceXs,
    },
    editChoice: {
      paddingHorizontal: spacing.spaceSm,
      paddingVertical: spacing.spaceXs,
      borderRadius: 999,

      backgroundColor: colors.surface,
    },
    editChoiceSelected: {
      backgroundColor: colors.primaryContainer,
    },
    editChoiceText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
    editChoiceTextSelected: {
      color: colors.primary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    dialogButtonPrimary: {
      backgroundColor: colors.primary,
    },
    dialogButtonPrimaryText: {
      ...typography.labelLg,
      color: colors.onPrimary,

      textAlign: "center",
      flexShrink: 1,
    },
    identityCopy: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
    },
    userName: {
      ...typography.headlineSm,
      color: colors.onSurface,
      flexShrink: 1,
    },
    userPhone: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    phoneLink: {
      ...typography.labelMd,
      color: colors.primary,
    },
    userEmail: {
      ...typography.labelSm,
      color: colors.outline,
    },
    memberPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.gap1_5,
      paddingHorizontal: spacing.px2_5,
      paddingVertical: spacing.py0_5,
      borderRadius: 999,
      backgroundColor: colors.tertiaryFixed,
      marginTop: spacing.spaceXs,
    },
    memberPillText: {
      ...typography.labelSm,
      color: colors.onTertiaryFixed,
    },
    statsGrid: {
      flexDirection: "row",
      gap: spacing.spaceXs,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 64,
      paddingHorizontal: spacing.spaceXs,
      paddingVertical: spacing.spaceSm,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLow,
    },
    statValue: {
      ...typography.headlineSm,
      color: colors.onSurface,
    },
    statValuePrimary: {
      color: colors.primary,
    },
    statValueTertiary: {
      color: colors.tertiary,
    },
    statLabel: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    section: { gap: 0 },
    menuGroup: {
      paddingVertical: spacing.gap1_5,
      paddingHorizontal: spacing.px5,
    },
    menuRow: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceMd,
      paddingVertical: spacing.px3,
    },
    menuRowPressed: {
      opacity: 0.6,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.outlineVariant,
    },
    menuLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.px3_5,
      flex: 1,
      minWidth: 0,
    },
    menuIconBox: {
      width: spacing.iconButtonSm,
      height: spacing.iconButtonSm,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    menuCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.py0_5,
    },
    menuTitle: {
      ...typography.bodyLgMedium,
      color: colors.onSurface,
    },
    menuSubtitle: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    menuRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
      flexShrink: 0,
    },
    menuBadge: {
      paddingHorizontal: spacing.px2_5,
      paddingVertical: spacing.py0_5,
      borderRadius: 999,
      backgroundColor: colors.primaryTint,
    },
    menuBadgeHighlighted: {
      backgroundColor: colors.primaryContainer,
    },
    menuBadgeText: {
      ...typography.labelSm,
      color: colors.primary,
    },
    menuBadgeTextHighlighted: {
      color: colors.onPrimaryContainer,
      fontWeight: "700",
    },
    logoutRow: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.px3_5,
      paddingVertical: spacing.px3,
    },
    logoutRowText: {
      ...typography.bodyLgMedium,
      color: colors.primary,
    },
    footer: {
      paddingTop: spacing.spaceXs,
      gap: spacing.spaceMd,
      alignItems: "center",
    },
    logoutButton: {
      width: "100%",
      height: spacing.buttonMdHeight,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLow,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
    },
    logoutText: {
      ...typography.labelLg,
      color: colors.onSurfaceVariant,
    },
    deleteAccountButton: {
      width: "100%",
      height: spacing.buttonMdHeight,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: colors.error,
    },
    buttonPressed: { opacity: 0.8 },
    legalLinks: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceSm,
      paddingVertical: spacing.spaceXs,
    },
    legalLinkText: {
      ...typography.labelSm,
      color: colors.primary,
      textDecorationLine: "none",
    },
    legalSeparator: { ...typography.labelSm, color: colors.onSurfaceVariant },
    deleteAccountText: {
      ...typography.labelLg,
      color: colors.onError,
    },
    tabBar: {
      height: spacing.headerHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: spacing.spaceXs,
      backgroundColor: colors.surfaceContainerLowest,
    },
    tabItem: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.gap1,
    },
    tabDot: {
      position: "absolute",
      top: 0,
      right: 0,
      width: spacing.badgeSm,
      height: spacing.badgeSm,
      borderRadius: 999,
      backgroundColor: colors.error,
    },
    tabLabel: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    tabLabelActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    dialogOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      padding: spacing.margin,
      backgroundColor: colors.inverseSurface40,
    },
    dialogCard: {
      width: "100%",
      maxWidth: spacing.modalMaxWidth,
      alignSelf: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      gap: spacing.spaceMd,
    },
    deleteDialogCard: {
      width: "100%",
      maxWidth: spacing.modalMaxWidth,
      alignSelf: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      gap: spacing.spaceMd,
    },
    deleteDialogText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    dialogIcon: {
      width: spacing.editButton,
      height: spacing.editButton,
      borderRadius: 999,
      backgroundColor: colors.errorContainer,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    dialogCopy: {
      alignItems: "center",
    },
    dialogTitle: {
      ...typography.headlineSm,
      color: colors.onSurface,
      textAlign: "center",
    },
    dialogMeta: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: spacing.py1,
    },
    dialogActions: {
      flexDirection: "row",
      gap: spacing.spaceSm,
    },
    dialogButton: {
      flexGrow: 1,
      flexBasis: 0,
      minWidth: 0,
      height: 48,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 8,
    },
    dialogButtonGhost: {
      backgroundColor: colors.surfaceContainer,
    },
    dialogButtonGhostText: {
      ...typography.labelLg,
      color: colors.onSurface,

      textAlign: "center",
      flexShrink: 1,
    },
    dialogButtonDanger: {
      backgroundColor: colors.error,
    },
    deleteConfirmButton: { backgroundColor: colors.error },
    dialogButtonDangerText: {
      ...typography.labelLg,
      color: colors.onError,

      textAlign: "center",
      flexShrink: 1,
    },
  });
