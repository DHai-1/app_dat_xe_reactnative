import { transmissionLabel, vehicleTypeLabel } from '@/lib/displayLabels';
import type { DriverOffer } from '@/lib/driverOffer';
import { formatDistance, formatMoney } from '@datxe/shared';
import { offerPalette as palette, Typography as Text } from '@datxe/ui';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

const EARNING_DISPLAY_STEP_VND = 500;

function compactAddress(address: string) {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  const street = parts.findIndex(part => /^(?:\d+[a-z]?\s+)?(?:đường\s|đ\.\s*|phố\s|ngõ\s|ngách\s|quốc lộ\s|ql\.?\s*)/iu.test(part));
  const district = parts.findIndex((part, index) =>
    index > street && /^(?:quận|huyện|thị xã|q\.|h\.)/iu.test(part));
  if (street >= 0) return [parts[street], parts[district] ?? parts[street + 1]].filter(Boolean).join(', ');
  return parts.slice(0, 2).join(', ') || 'Chưa có địa chỉ';
}

function validEstimate(value?: number | null): value is number {
  return value != null && Number.isFinite(value) && value >= 0;
}

function legEstimate(km?: number | null, minutes?: number | null) {
  const metrics = [];
  if (validEstimate(km)) metrics.push(formatDistance(km));
  if (validEstimate(minutes)) metrics.push(`${Math.round(minutes)} phút`);
  return metrics.join(' • ') || 'Chưa có ước tính';
}

function Stop({ kind, address, km, minutes }: {
  kind: 'pickup' | 'dropoff';
  address: string;
  km?: number | null;
  minutes?: number | null;
}) {
  const pickup = kind === 'pickup';
  const label = pickup ? 'Điểm đón' : 'Điểm trả';
  const estimate = legEstimate(km, minutes);
  return (
    <View accessible accessibilityLabel={`${label}, ${address || 'Chưa có địa chỉ'}, ${estimate}`} style={styles.stop}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: pickup ? palette.red : palette.emerald }]} />
        {pickup ? (
          <View style={styles.connector}>
            {[0, 1, 2, 3, 4].map(dash => <View key={dash} style={styles.dash} />)}
          </View>
        ) : null}
      </View>
      <View style={styles.stopText}>
        <Text numberOfLines={1} style={styles.address}>{compactAddress(address)}</Text>
        <Text style={styles.estimate}>{estimate}</Text>
      </View>
    </View>
  );
}

export const OfferDecision = memo(function OfferDecision({ offer }: { offer: DriverOffer }) {
  const totalKm = validEstimate(offer.distanceToPickupKm) && validEstimate(offer.tripDistanceKm)
    ? formatDistance(offer.distanceToPickupKm + offer.tripDistanceKm) : null;
  const totalMinutes = validEstimate(offer.etaToPickupMin) && validEstimate(offer.estDurationMin)
    ? `${Math.round(offer.etaToPickupMin + offer.estDurationMin)} phút` : null;
  const total = [totalMinutes, totalKm].filter(Boolean).join(' • ');
  const earning = offer.driverEarning;
  const roundedEarning = Math.round(earning / EARNING_DISPLAY_STEP_VND) * EARNING_DISPLAY_STEP_VND;
  return (
    <>
      <View style={styles.header}>
        <View style={styles.earnings}>
          <Text style={styles.caption}>Thu nhập dự kiến</Text>
          {validEstimate(earning) ? (
            <Text accessibilityRole="header" style={styles.amount}>{roundedEarning !== earning ? '≈ ' : ''}{formatMoney(roundedEarning)}</Text>
          ) : <Text style={styles.summary}>Chưa có thông tin</Text>}
        </View>
        <View style={styles.badge}>
          <Text style={styles.vehicle}>{vehicleTypeLabel(offer.vehicle.type)}</Text>
          <Text style={styles.transmission}>{transmissionLabel(offer.vehicle.transmission)}</Text>
        </View>
      </View>
      <Text style={styles.summary}>{total ? `Tổng cộng: ${total}` : 'Chưa đủ dữ liệu tổng hành trình'}</Text>
      <View style={styles.timeline}>
        <Stop kind="pickup" address={offer.pickup.address} km={offer.distanceToPickupKm} minutes={offer.etaToPickupMin} />
        <Stop kind="dropoff" address={offer.dropoff.address} km={offer.tripDistanceKm} minutes={offer.estDurationMin} />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 12, rowGap: 8 },
  earnings: { flexGrow: 1, flexShrink: 1 },
  caption: { color: palette.muted, fontSize: 13, lineHeight: 17 },
  amount: { color: palette.emerald, fontSize: 36, lineHeight: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  badge: { alignItems: 'center', backgroundColor: palette.badge, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, maxWidth: '100%' },
  vehicle: { color: palette.text, fontSize: 16, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  transmission: { color: palette.text, fontSize: 13, lineHeight: 17, textAlign: 'center' },
  summary: { color: palette.muted, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
  timeline: { gap: 2 },
  stop: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center', paddingTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  connector: { flex: 1, width: 1, gap: 3, marginTop: 4 },
  dash: { flex: 1, backgroundColor: palette.muted },
  stopText: { flex: 1, gap: 2, paddingBottom: 8 },
  address: { color: palette.text, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  estimate: { color: palette.muted, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
});
