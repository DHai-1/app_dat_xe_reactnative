import { StyleSheet } from 'react-native';
import { colors, fontFamily } from '@datxe/ui';
export const rideStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, watermark: { position: 'absolute', width: 340, height: 340, left: '55%', top: '50%', marginLeft: -170, marginTop: -170, opacity: 0.5 }, page: { padding: 20, gap: 16, paddingBottom: 28 },
  title: { fontFamily: fontFamily.inter, fontSize: 24, fontWeight: '700', color: colors.onSurface },
  text: { fontFamily: fontFamily.inter, fontSize: 16, lineHeight: 24, color: colors.onSurface },
  label: { fontFamily: fontFamily.inter, fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant },
  card: { padding: 18, borderRadius: 18, gap: 10, backgroundColor: colors.surfaceContainerLowest },
  button: { padding: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  buttonText: { fontFamily: fontFamily.inter, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
  deleteButtonText: { fontFamily: fontFamily.inter, fontSize: 16, fontWeight: '700', color: colors.error },
  link: { fontFamily: fontFamily.inter, fontSize: 15, color: colors.primary, fontWeight: '600' },
  error: { fontFamily: fontFamily.inter, fontSize: 14, color: colors.error },
  tabBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, backgroundColor: colors.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: colors.outlineVariant, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  tabLabel: { fontFamily: fontFamily.inter, fontSize: 11, color: colors.onSurfaceVariant },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
});
