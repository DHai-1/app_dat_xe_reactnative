import { useReducedMotion } from '@datxe/ui';
import type { MapViewportInsets } from '@datxe/ui/goong-map';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const pinMarker = require('../../../../assets/images/marker-pin.png');
const PIN_SIZE = 52;

export function MapPickerPin({ moving, viewport }: { moving: boolean; viewport: MapViewportInsets }) {
  const lift = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    lift.value = withTiming(moving ? -12 : 0, { duration: reducedMotion ? 0 : 160 });
  }, [lift, moving, reducedMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <View pointerEvents="none" style={[styles.anchor, {
      // The tip stays at the logical camera center above the sheet when resting.
      marginTop: (viewport.top - viewport.bottom) / 2 - PIN_SIZE,
    }]}>
      <Animated.Image source={pinMarker} resizeMode="contain" accessibilityIgnoresInvertColors
        style={[styles.pin, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: '50%', top: '50%', marginLeft: -PIN_SIZE / 2 },
  pin: { width: PIN_SIZE, height: PIN_SIZE },
});
