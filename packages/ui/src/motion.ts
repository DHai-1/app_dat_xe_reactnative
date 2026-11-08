import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useThemeColors } from './theme/ThemeProvider';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }, () => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

export function useScreenMotion(tab = false) {
  const reduced = useReducedMotion();
  const colors=useThemeColors();
  return {
    headerShown: false,
    animation: reduced || tab ? 'none' as const : Platform.OS === 'ios' ? 'default' as const : 'fade_from_bottom' as const,
    gestureEnabled: true,
    fullScreenGestureEnabled: false,
    contentStyle: { backgroundColor: colors.background },
  };
}
