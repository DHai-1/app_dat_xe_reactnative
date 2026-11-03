import { logError } from "@/lib/logger";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  Button,
  Typography as Text,
  useLanguage,
  useThemedStyles,
} from "@datxe/ui";
import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  useEffect(() => {
    logError(error);
  }, [error]);
  return (
    <View style={extra.item1}>
      <Text>{i18nT("Đã xảy ra lỗi. Vui lòng thử lại.")}</Text>
      <Button label={i18nT("Thử lại")} onPress={retry} />
    </View>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 16,
      backgroundColor: colors.background,
    },
  });
