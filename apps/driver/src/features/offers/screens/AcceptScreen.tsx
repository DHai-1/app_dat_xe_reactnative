import { DriverCreditGate } from "../components/DriverCreditGate";
import BottomSheet from '@gorhom/bottom-sheet';
import { Button, offerPalette as palette, Typography as Text } from '@datxe/ui';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfferActions } from '../components/OfferActions';
import { OfferDecision } from '../components/OfferDecision';
import { OfferMap } from '../components/OfferMap';
import { useAccept } from '../hooks/useAccept';

export default function AcceptRideScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const h = useAccept();
  const { offer } = h;
  const live = Boolean(offer && h.secondsLeft > 0);
  const sheetHeight = Math.round(height * 0.58);
  // Reserve extra clearance above the sheet while keeping room for the route on short screens.
  const mapClearance = Math.min(32, Math.max(0, height - top - sheetHeight - 128));
  const snapPoints = useMemo(() => [sheetHeight], [sheetHeight]);

  if (!h.credit.allowed && !h.busy) return <DriverCreditGate credit={h.credit} />;

  return (
    <View style={styles.screen} onLayout={event => setHeight(Math.round(event.nativeEvent.layout.height))}>
      <StatusBar style="light" />
      {offer && (live || h.busy) ? (
        <>
          <OfferMap offer={offer} live={live} top={top} bottom={sheetHeight + mapClearance} />
          {sheetHeight > 0 ? (
            <BottomSheet
              index={0}
              snapPoints={snapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose={false}
              enableHandlePanningGesture={false}
              enableContentPanningGesture={false}
              enableOverDrag={false}
              handleComponent={null}
              backgroundStyle={styles.sheet}
            >
              <View style={[styles.sheetContent, { height: sheetHeight, paddingBottom: bottom + 4 }]}>
                <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent}>
                  <OfferDecision offer={offer} />
                </ScrollView>
                <View style={styles.footer}>
                  <OfferActions expiresAt={h.expiresAt} secondsLeft={h.secondsLeft}
                    busy={h.busy} error={h.error} onAccept={h.accept} onSkip={h.reject} />
                </View>
              </View>
            </BottomSheet>
          ) : null}
        </>
      ) : (
        <View style={[styles.state, { paddingTop: top + 16, paddingBottom: bottom + 16 }]}>
          {h.loading ? (
            <>
              <ActivityIndicator color={palette.muted} />
              <Text style={styles.stateText}>Đang tải yêu cầu chuyến…</Text>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={styles.stateTitle}>
                {offer ? 'Cuốc đã hết hạn' : 'Yêu cầu chưa khả dụng'}
              </Text>
              <Text accessibilityRole={h.error ? 'alert' : undefined} style={styles.stateText}>
                {h.error || (offer ? 'Về Trang chủ để chờ cuốc mới.' : 'Hiện chưa có yêu cầu chuyến đi đang chờ.')}
              </Text>
              {!offer && h.error ? (
                <Button variant="secondary" label="Kiểm tra lại" style={styles.stateButton}
                  contentColor={palette.text} onPress={() => void h.refresh()} />
              ) : null}
              <Button variant="ghost" label="Về trang chủ" contentColor={palette.text}
                onPress={() => h.router.replace('/(tabs)/home')} />
            </>
          )}
        </View>
      )}
      <View pointerEvents="none" style={[styles.statusBar, { height: top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  statusBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: palette.background },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetContent: { paddingTop: 4 },
  details: { flex: 1 },
  detailsContent: { gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 4, backgroundColor: palette.surface },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  stateTitle: { color: palette.text, fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center' },
  stateText: { color: palette.muted, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  stateButton: { backgroundColor: palette.badge },
});
