import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const genderOptions = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;

export function formatIsoDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  )
    return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
      minHeight: spacing.headerHeight,
      paddingHorizontal: spacing.spaceSm,
    },
    title: {
      ...typography.titleLg,
      color: colors.onSurface,
      flex: 1,
    },
    content: {
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceSm,
      paddingBottom: spacing.spaceLg,
      gap: spacing.spaceMd,
    },
    fieldGroup: { gap: spacing.gap1_5 },
    fieldLabel: {
      ...typography.labelLg,
      fontSize: 13,
      color: colors.onSurface,
    },
    inputSurface: {
      backgroundColor: colors.cardSurface,
    },
    dateRow: {
      minHeight: spacing.inputHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
      paddingHorizontal: spacing.px3_5,
    },
    dateInput: {
      ...typography.bodyLg,
      fontSize: 15,
      flex: 1,
      minWidth: 0,
      color: colors.onSurface,
    },
    datePlaceholder: { color: colors.onSurfaceVariant },
    fieldHint: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    genderOptions: {
      flexDirection: "row",
      gap: spacing.spaceSm,
      flexWrap: "wrap",
    },
    genderOption: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: spacing.spaceMd,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLowest,
    },
    genderOptionSelected: {
      backgroundColor: colors.primaryContainer,
    },
    genderOptionText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
    genderOptionTextSelected: {
      color: colors.onPrimaryContainer,
      fontWeight: "700",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      padding: spacing.px3_5,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
    },
    infoCopy: { flex: 1 },
    infoLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
    infoValue: {
      ...typography.labelMd,
      color: colors.onSurface,
      marginTop: spacing.py0_5,
    },
    helperText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    errorText: { ...typography.bodyMd, color: colors.error },
    footer: {
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceSm,
    },
    legalNotice: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: spacing.spaceLg,
      paddingBottom: spacing.spaceSm,
    },
    legalLink: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
