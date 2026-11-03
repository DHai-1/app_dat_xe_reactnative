import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
} from "react-native";
import { useReducedMotion } from "../motion";
import { useLanguage } from "../useLanguage";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function MotionPressable({
  style,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  ...props
}: PressableProps) {
  useLanguage();

  const [scale] = useState(() => new Animated.Value(1));
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (disabled || reduced) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [disabled, reduced, scale]);
  const animate = (value: number) => {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: reduced ? 1 : value,
      duration: value === 1 ? 160 : 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };
  // Animated must receive a resolved style, not Pressable's style callback.
  const interactionState = {
    pressed: pressed && !disabled,
    hovered: hovered && !disabled,
  };
  const resolvedStyle =
    typeof style === "function" ? style(interactionState) : style;
  const transform = StyleSheet.flatten(resolvedStyle)?.transform;
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        setPressed(true);
        animate(0.98);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animate(1);
        onPressOut?.(event);
      }}
      style={[
        resolvedStyle,
        {
          transform: [
            ...(Array.isArray(transform) ? transform : []),
            { scale },
          ],
        },
      ]}
    />
  );
}
