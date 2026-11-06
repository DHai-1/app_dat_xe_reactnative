import { isPushHeadlessLaunch } from '@datxe/shared';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

/** iOS may mount React for a silent push; keep auth/GPS/router side effects asleep. */
export function usePushForegroundLaunch() {
  const [ready, setReady] = useState(Platform.OS !== 'ios');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    const sub = AppState.addEventListener('change', state => { if (state === 'active') setReady(true); });
    void isPushHeadlessLaunch().then(headless => {
      if (alive) setReady(!headless || AppState.currentState === 'active');
    }).catch(() => { if (alive) setReady(AppState.currentState === 'active'); });
    return () => { alive = false; sub.remove(); };
  }, []);
  return ready;
}
