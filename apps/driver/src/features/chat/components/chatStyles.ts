import { StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '@datxe/ui';

export const chatStyles = (c: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.spaceMd, backgroundColor: c.surfaceContainerLowest, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.outlineVariant },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  title: { ...typography.headlineSm, color: c.onSurface },
  subtitle: { ...typography.bodyMd, color: c.onSurfaceVariant },
  list: { padding: spacing.spaceMd, gap: 12, flexGrow: 1 },
  row: { alignItems: 'flex-start' },
  mine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '88%', padding: 12, borderRadius: 18, gap: 6, backgroundColor: c.surfaceContainerHigh },
  mineBubble: { backgroundColor: c.primaryContainer },
  body: { ...typography.bodyLg, color: c.onSurface },
  mineText: { color: c.onPrimaryContainer },
  meta: { ...typography.labelSm, color: c.onSurfaceVariant },
  attachment: { width: 220, height: 180, maxWidth: '100%', borderRadius: 12 },
  notice: { paddingHorizontal: spacing.spaceMd, paddingVertical: 10, backgroundColor: c.surfaceContainerLow, gap: 8 },
  error: { ...typography.bodyMd, color: c.error },
  link: { ...typography.labelLg, color: c.primary, paddingVertical: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, backgroundColor: c.surfaceContainerLowest, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.outlineVariant },
  input: { flex: 1, minHeight: 48, maxHeight: 140, padding: 12, borderRadius: 20, backgroundColor: c.surfaceContainerLow, color: c.onSurface, ...typography.bodyLg },
  send: { backgroundColor: c.primary },
  disabled: { opacity: 0.45 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  preview: { flex: 1, backgroundColor: c.background, padding: 16 },
  previewImage: { flex: 1, width: '100%' },
});
