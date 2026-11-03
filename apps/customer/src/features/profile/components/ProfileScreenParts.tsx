import type { PaymentMethod } from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import { borderRadius, shadowStyle, spacing, typography, useThemeColors } from "@datxe/ui";
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
      backgroundColor: colors.surface,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceLg,
      paddingBottom: spacing.spaceXl,
      gap: spacing.spaceLg + spacing.spaceXs,
    },
    identityCard: {
      gap: spacing.spaceLg,
      padding: spacing.spaceLg,
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceMd,
    },
    avatarWrap: {
      flexShrink: 0,
      position: "relative",
    },
    avatar: {
      width: spacing.profileAvatar,
      height: spacing.profileAvatar,
      borderRadius: borderRadius.full,

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
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    loadErrorBox: {
      padding: spacing.spaceSm,
      borderRadius: borderRadius.lg,
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
      borderRadius: borderRadius.xl,
      padding: spacing.spaceMd,
      gap: spacing.spaceMd,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
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
      borderRadius: borderRadius.lg,
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
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
    },
    editChoiceSelected: {
      borderColor: colors.primary,
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
      borderRadius: borderRadius.full,
      backgroundColor: colors.tertiaryFixed,
      marginTop: spacing.spaceXs,
    },
    memberPillText: {
      ...typography.labelSm,
      color: colors.onTertiaryFixed,
    },
    editButton: {
      width: spacing.editButton,
      height: spacing.editButton,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainer,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
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
      borderRadius: borderRadius.lg,
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
    section: {
      gap: spacing.px3,
    },
    sectionLabel: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
      textTransform: "uppercase",
      letterSpacing: spacing.letterSpacingWidest,
      paddingHorizontal: spacing.spaceXs,
      marginBottom: spacing.spaceXs,
    },
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
      borderRadius: borderRadius.xl,
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
      borderRadius: borderRadius.full,
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
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outlineVariant,
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
      borderRadius: borderRadius.xl,
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
      textDecorationLine: "underline",
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
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
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
      borderRadius: borderRadius.full,
      backgroundColor: colors.error,
      borderWidth: 2,
      borderColor: colors.surface,
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
      borderRadius: borderRadius.xl,
      padding: spacing.spaceMd,
      gap: spacing.spaceMd,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    deleteDialogCard: {
      width: "100%",
      maxWidth: spacing.modalMaxWidth,
      alignSelf: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: borderRadius.xl,
      padding: spacing.spaceMd,
      gap: spacing.spaceMd,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...shadowStyle,
    },
    deleteDialogText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    dialogIcon: {
      width: spacing.editButton,
      height: spacing.editButton,
      borderRadius: borderRadius.full,
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
      flex: 1,
      height: spacing.buttonMdHeight,
      borderRadius: borderRadius.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    dialogButtonGhost: {
      backgroundColor: colors.surfaceContainer,
    },
    dialogButtonGhostText: {
      ...typography.labelLg,
      color: colors.onSurface,
    },
    dialogButtonDanger: {
      backgroundColor: colors.error,

    },
    deleteConfirmButton: { backgroundColor: colors.error },
    dialogButtonDangerText: {
      ...typography.labelLg,
      color: colors.onError,
    },
  });
