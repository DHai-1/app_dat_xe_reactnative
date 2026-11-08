import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

type HeadingReading = { trueHeading: number; magHeading: number; accuracy: number };
type WatchHeading = (
  onReading: (reading: HeadingReading) => void,
  onError: () => void,
) => Promise<{ remove: () => void }>;

export function useDeviceHeading(enabled: boolean, watchHeading: WatchHeading) {
  const [active, setActive] = useState(() => AppState.currentState == null || AppState.currentState === 'active');
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !active || Platform.OS === 'web') return;
    let watching = true;
    let subscription: Awaited<ReturnType<WatchHeading>> | undefined;
    const clearHeading = () => { if (watching) setHeading(null); };

    void watchHeading(reading => {
      if (!watching) return;
      const degrees = reading.trueHeading >= 0 && Number.isFinite(reading.trueHeading)
        ? reading.trueHeading : reading.magHeading;
      setHeading(reading.accuracy > 0 && Number.isFinite(degrees) && degrees >= 0 ? degrees % 360 : null);
    }, clearHeading).then(result => {
      if (watching) subscription = result;
      else result.remove();
    }).catch(clearHeading);

    return () => {
      watching = false;
      subscription?.remove();
      setHeading(null);
    };
  }, [active, enabled, watchHeading]);

  return enabled && active ? heading : null;
}
