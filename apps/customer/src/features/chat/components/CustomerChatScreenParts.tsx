import type { CustomerRideDetail } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { borderRadius, spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const CHAT_OPEN_STATUSES = new Set<CustomerRideDetail["status"]>([
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
]);

export function canChat(ride: CustomerRideDetail | null): boolean {
  return Boolean(ride?.driverId && CHAT_OPEN_STATUSES.has(ride.status));
}

export function makeUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
    },
  );
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    flex: { flex: 1 },
    messages: {
      flexGrow: 1,
      padding: spacing.margin,
      gap: 10,
      justifyContent: "flex-end",
    },
    loadOlder: { alignItems: "center", padding: 8 },
    link: { ...typography.labelMd, color: colors.primary },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      padding: 24,
    },
    emptyTitle: {
      ...typography.labelLg,
      color: colors.onSurface,
      textAlign: "center",
    },
    emptyCopy: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    messageRow: { width: "100%", alignItems: "flex-start" },
    messageRowMine: { alignItems: "flex-end" },
    bubble: {
      maxWidth: "84%",
      borderRadius: borderRadius.lg,
      padding: 11,
      gap: 5,
    },
    bubbleDriver: {
      backgroundColor: colors.surfaceContainerLowest,
      borderBottomLeftRadius: 4,
    },
    bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    messageText: { ...typography.bodyMd, color: colors.onSurface },
    messageTextMine: { color: colors.onPrimary },
    messageTime: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      alignSelf: "flex-end",
    },
    messageTimeMine: { color: colors.primaryFixedTint },
    attachment: {
      width: 210,
      height: 180,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerHigh,
    },
    error: {
      ...typography.bodyMd,
      color: colors.error,
      textAlign: "center",
      padding: 8,
    },
    closedNotice: {
      paddingHorizontal: spacing.margin,
      paddingVertical: 8,
      backgroundColor: colors.surfaceContainerHigh,
    },
    closedText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: spacing.margin,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      backgroundColor: colors.surface,
    },
    imageButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryFixedTint,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 42,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 21,
      backgroundColor: colors.surfaceContainerHigh,
      ...typography.bodyMd,
      color: colors.onSurface,
    },
    sendButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    disabled: { opacity: 0.45 },
  });
