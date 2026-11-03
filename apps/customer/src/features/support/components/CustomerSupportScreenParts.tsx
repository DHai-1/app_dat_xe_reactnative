import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 13, paddingBottom: 28 },
    notice: {
      alignItems: "center",
      gap: 9,
      padding: 20,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primaryFixedTint,
    },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    body: { ...typography.bodyMd, color: colors.onSurface, textAlign: "left" },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    card: {
      padding: 16,
      gap: 9,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
    },
    section: { ...typography.labelLg, color: colors.onSurface },
    ride: {
      padding: 15,
      gap: 7,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surfaceContainerLowest,
    },
    label: { ...typography.labelSm, color: colors.primary },
    link: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 6,
    },
    linkText: { ...typography.labelLg, color: colors.primary },
    chat: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryFixedTint,
    },
    chatText: { ...typography.labelLg, color: colors.primary },
  });
