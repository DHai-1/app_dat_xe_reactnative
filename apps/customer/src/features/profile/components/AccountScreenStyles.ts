import type { useThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";
/**
 * Style cho màn tài khoản (Chỉnh sửa thông tin, Phương thức thanh toán).
 * Dark mode: nền #111111, card #1C1C1E, ô nhập #2C2C2E, không dùng viền để tránh "box-in-box".
 */
export const accountStyles = (c: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, gap: 24, paddingBottom: 112 },
    group: { gap: 0 },
    intro: { fontSize: 14, lineHeight: 22, color: c.onSurfaceVariant },
    section: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.onSurfaceVariant,
    },
    card: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: c.cardSurface,
      gap: 16,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 16 },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primaryFixedTint,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 17, fontWeight: "500", color: c.onSurface },
    label: { fontSize: 14, fontWeight: "600", color: c.onSurface },
    field: { gap: 8 },
    inputWrap: { justifyContent: "center" },
    input: {
      minHeight: 52,
      borderRadius: 24,
      paddingHorizontal: 16,
      color: c.onSurface,
      backgroundColor: c.inputSurface,
      fontSize: 16,
    },
    inputPadded: { paddingRight: 44 },
    inputReadonly: { color: c.onSurfaceVariant },
    inputIcon: { position: "absolute", right: 14 },
    dateRow: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 24,
      backgroundColor: c.inputSurface,
      paddingHorizontal: 16,
    },
    dateText: { flex: 1, fontSize: 16, color: c.onSurface },
    dateTextPlaceholder: { color: c.onSurfaceVariant },
    choices: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    choice: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 999,

      backgroundColor: c.surfaceContainerHigh,
    },
    selected: {
      backgroundColor: c.primaryContainer,
    },
    choiceText: { fontSize: 14, fontWeight: "500", color: c.onSurface },
    choiceTextSelected: { color: c.onPrimaryContainer, fontWeight: "600" },
    phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    error: { fontSize: 14, lineHeight: 21, color: c.error },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      backgroundColor: c.background,
      gap: 8,
    },
  });
