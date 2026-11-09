import { env } from '@/config/env';
import type { DriverOffer } from '@/lib/driverOffer';
import { offerPalette as palette, Typography as Text } from '@datxe/ui';
import { GoongMap, useDeviceHeading } from '@datxe/ui/goong-map';
import { watchHeadingAsync } from 'expo-location';
import { useIsFocused } from 'expo-router';
import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useOfferMap } from '../hooks/useOfferMap';

export const OfferMap = memo(function OfferMap({ offer, live, top, bottom }: {
  offer: DriverOffer;
  live: boolean;
  top: number;
  bottom: number;
}) {
  const [ready, setReady] = useState(false);
  const { approximate, ...map } = useOfferMap(offer, live);
  const focused = useIsFocused();
  const hasDriver = Boolean(map.currentLocation);
  const heading = useDeviceHeading(focused && live && hasDriver, watchHeadingAsync);
  return (
    <View style={StyleSheet.absoluteFill}>
      <GoongMap {...map} mapKey={env.goongMapKey} viewport={{ top, bottom }} onReadyChange={setReady} currentHeading={heading} />
      {ready && (approximate || !hasDriver) ? (
        <View pointerEvents="none" style={[styles.notice, { top: top + 8 }]}>
          {!hasDriver ? <Text style={styles.label}>Chưa có vị trí tài xế</Text> : null}
          {approximate ? <Text style={styles.label}>Đường nối ước tính</Text> : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  notice: {
    position: 'absolute', right: 12, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: palette.surface,
  },
  label: { color: palette.text, fontSize: 13, lineHeight: 17 },
});
