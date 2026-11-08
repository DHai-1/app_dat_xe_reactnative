import { ActivityIndicator } from "react-native-paper";
import { translate as i18nT } from "@datxe/shared";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  MotionPressable as Pressable,
  Typography as Text,
} from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import { spacing, typography } from "../theme/colors";

type Props = {
  onResend: () => Promise<boolean>;
  disabled?: boolean;
  /** Firebase chặn gửi lại SMS trong ~60s cho cùng số, nên mặc định đếm 60s. */
  delaySeconds?: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function ResendOtpButton({
  onResend,
  disabled = false,
  delaySeconds = 60,
}: Props) {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const [secondsLeft, setSecondsLeft] = useState(delaySeconds);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const canPress = !disabled && !sending && secondsLeft <= 0;

  const handlePress = async () => {
    if (!canPress) return;
    setSending(true);
    try {
      if (await onResend()) setSecondsLeft(delaySeconds);
    } finally {
      setSending(false);
    }
  };

  return (
    <Pressable
      accessibilityLabel={i18nT(
        canPress ? "Gửi lại mã OTP" : "Chưa thể gửi lại mã OTP",
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: !canPress }}
      disabled={!canPress}
      hitSlop={8}
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        styles.button,
        pressed && canPress && styles.buttonPressed,
      ]}
    >
      {sending ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : null}
      <Text style={[styles.label, canPress && styles.labelEnabled]}>
        {sending
          ? i18nT("Đang gửi lại mã...")
          : secondsLeft > 0
            ? `${i18nT("Gửi lại mã OTP sau")} (${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)})`
            : i18nT("Gửi lại mã OTP")}
      </Text>
    </Pressable>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      minWidth: 48,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      paddingVertical: spacing.spaceXs,
      paddingHorizontal: spacing.spaceXs,
      borderRadius: 999,
    },
    buttonPressed: {
      backgroundColor: colors.primaryTint,
    },
    label: { ...typography.bodyMdMedium, color: colors.onSurfaceVariant, fontVariant: ["tabular-nums"] },
    labelEnabled: { color: colors.primary, fontWeight: "600" },
  });
