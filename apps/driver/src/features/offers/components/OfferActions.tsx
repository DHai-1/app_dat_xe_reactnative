import { translate as t } from '@datxe/shared';
import { Button, offerPalette as palette, Typography as Text, useLanguage, useReducedMotion } from '@datxe/ui';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { ActivityIndicator, TouchableRipple } from 'react-native-paper';
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';

const PROGRESS_WINDOW_MS = 20_000;

function AcceptOfferButton({ expiresAt, secondsLeft, busy, onPress }: {
  expiresAt: number;
  secondsLeft: number;
  busy: boolean;
  onPress: () => void;
}) {
  useLanguage();
  const disabled = busy || secondsLeft <= 0;
  const label = t(busy ? 'Đang xử lý…' : 'Nhận chuyến');
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  useEffect(() => {
    if (reducedMotion) return;
    const sync = () => {
      cancelAnimation(progress);
      const remaining = Math.max(0, expiresAt - Date.now());
      progress.value = Math.min(1, remaining / PROGRESS_WINDOW_MS);
      const drain = withTiming(0, { duration: Math.min(remaining, PROGRESS_WINDOW_MS), easing: Easing.linear });
      progress.value = remaining > PROGRESS_WINDOW_MS
        ? withDelay(remaining - PROGRESS_WINDOW_MS, drain, ReduceMotion.System) : drain;
    };
    sync();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    return () => { sub.remove(); cancelAnimation(progress); };
  }, [expiresAt, progress, reducedMotion]);

  return (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={disabled ? label : `${label}, ${t('{0} giây', { '0': secondsLeft })}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.accept, disabled && styles.disabled]}
    >
      <View style={styles.acceptContent}>
        {!disabled ? (
          <Animated.View pointerEvents="none" style={[
            styles.fill,
            reducedMotion ? { width: `${Math.min(100, (secondsLeft * 1_000 / PROGRESS_WINDOW_MS) * 100)}%` } : style,
          ]} />
        ) : null}
        {busy ? <ActivityIndicator size="small" color={palette.muted} /> : null}
        <Text style={[styles.acceptLabel, disabled && styles.disabledLabel]}>{label}</Text>
        {!disabled ? <Text style={styles.time}>{secondsLeft}s</Text> : null}
      </View>
    </TouchableRipple>
  );
}

export function OfferActions({ expiresAt, secondsLeft, busy, error, onAccept, onSkip }: {
  expiresAt: number;
  secondsLeft: number;
  busy: boolean;
  error: string;
  onAccept: () => void;
  onSkip: () => void;
}) {
  const disabled = busy || secondsLeft <= 0;
  return (
    <View style={styles.actions}>
      {error ? <Text accessibilityRole="alert" numberOfLines={2} style={styles.error}>{error}</Text> : null}
      <AcceptOfferButton expiresAt={expiresAt} secondsLeft={secondsLeft} busy={busy} onPress={onAccept} />
      <Button label="Bỏ qua yêu cầu" variant="ghost" contentColor={palette.muted}
        onPress={onSkip} disabled={disabled} dimWhenDisabled={false} style={styles.skip} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 4 },
  accept: { borderRadius: 999, overflow: 'hidden', backgroundColor: palette.track },
  acceptContent: {
    minHeight: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: palette.acceptFill },
  time: { minWidth: 28, color: palette.text, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
  acceptLabel: { flexShrink: 1, color: palette.text, fontSize: 18, lineHeight: 23, fontWeight: '700', textAlign: 'center' },
  disabled: { backgroundColor: palette.disabled },
  disabledLabel: { color: palette.muted },
  skip: { backgroundColor: palette.surface },
  error: { color: palette.red, fontSize: 14, lineHeight: 18 },
});
