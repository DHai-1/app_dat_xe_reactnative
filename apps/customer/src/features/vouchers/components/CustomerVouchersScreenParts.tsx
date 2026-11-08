import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const money = (amount: number) =>
  i18nT("{0} đ", { "0": new Intl.NumberFormat(getLocale()).format(amount) });

export const date = (value: string) =>
  new Date(value).toLocaleDateString(getLocale());

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 28 },
    intro: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    voucher: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 0,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    voucherIcon: {
      width: 44,
      height: 44,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryFixedTint,
    },
    details: { flex: 1, gap: 4 },
    code: { ...typography.labelLg, color: colors.primary },
    discount: { ...typography.labelMd, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    use: { alignSelf: "flex-start", paddingVertical: 6 },
    useText: { ...typography.labelMd, color: colors.primary },
    empty: { alignItems: "center", gap: 8, padding: 24 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    error: { ...typography.bodyMd, color: colors.error },
  });
