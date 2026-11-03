import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  borderRadius,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet, View } from "react-native";
export function Metric({ label, value }: { label: string; value: string }) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();

  return (
    <View style={themed_styles.metric}>
      <Text style={themed_styles.meta}>{i18nT(label)}</Text>
      <Text style={themed_styles.metricValue}>{i18nT(value)}</Text>
    </View>
  );
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.margin, gap: 14, paddingBottom: 30 },
    subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    card: {
      padding: 16,
      gap: 13,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerLowest,
    },
    section: { ...typography.labelLg, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    body: { ...typography.bodyMd, color: colors.onSurface },
    label: { ...typography.labelMd, color: colors.onSurface },
    metrics: { flexDirection: "row", gap: 10 },
    metric: {
      flex: 1,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerHigh,
      padding: 12,
      gap: 4,
    },
    metricValue: { ...typography.labelLg, color: colors.onSurface },
    images: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    imageCard: { width: "47%", gap: 4 },
    image: {
      width: "100%",
      height: 120,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerHigh,
    },
    imageLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
    confirmed: { flexDirection: "row", alignItems: "center", gap: 8 },
    confirmedText: { ...typography.labelMd, color: colors.primary },
    error: { ...typography.bodyMd, color: colors.error },
    primary: {
      minHeight: 54,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { ...typography.labelLg, color: colors.onPrimary },
    disabled: { opacity: 0.6 },
  });
