import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { colors } from "./colors";
export type ThemeMode = "system" | "light" | "dark";
export type ThemeBrand = "customer" | "driver";
export type ThemeColors = { [K in keyof typeof colors]: string };
/**
 * Dark mode dùng lại đúng bộ màu đã duyệt: nền #111111, chữ #FFFFFF, phụ #888888,
 * viền #888888, nhấn #FF4757. Không thêm màu mới ngoài token.
 */
const dark = {
  background: "#111111",
  surface: "#111111",
  card: "#111111",
  text: "#ffffff",
  textSecondary: "#888888",
  border: "#888888",
  primary: "#ff4757",
  danger: "#ff4757",
};
const darkColors = {
  ...colors,
  background: dark.background,
  surface: dark.background,
  surfaceDim: dark.background,
  surfaceBright: "#111111",
  surfaceContainerLowest: dark.surface,
  surfaceContainerLow: dark.card,
  surfaceContainer: dark.card,
  surfaceContainerHigh: "#111111",
  surfaceContainerHighest: "#111111",
  surfaceVariant: "#111111",
  onSurface: dark.text,
  onBackground: dark.text,
  onSurfaceVariant: dark.textSecondary,
  outline: dark.border,
  outlineVariant: dark.border,
  outline70: "rgba(136,136,136,0.7)",
  primary: dark.primary,
  primaryContainer: "#ff4757",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#ffffff",
  primaryPressed: "#ff4757",
  primarySoft: "#111111",
  primaryFixed: "#111111",
  primaryFixedDim: "#111111",
  primaryFixedTint: "#111111",
  primaryFixedTintSoft: "#111111",
  primaryFixed20: "rgba(255,71,87,0.10)",
  primaryFixed30: "rgba(255,71,87,0.14)",
  primaryFixed40: "rgba(255,71,87,0.18)",
  primaryFixed50: "rgba(255,71,87,0.22)",
  onPrimaryFixed: "#ffffff",
  onPrimaryFixedVariant: "#ff4757",
  primary10: "rgba(255,71,87,0.10)",
  primary15: "rgba(255,71,87,0.15)",
  primaryTint: "rgba(255,71,87,0.12)",
  primaryTintStrong: "rgba(255,71,87,0.2)",
  surfaceTint: "#ff4757",
  inversePrimary: "#ff4757",
  inverseSurface: "#ffffff",
  inverseOnSurface: "#111111",
  secondary: "#888888",
  onSecondary: "#111111",
  secondaryContainer: "#111111",
  onSecondaryContainer: "#e0e0e0",
  secondaryFixed: "#111111",
  secondaryFixedDim: "#888888",
  onSecondaryFixed: "#ffffff",
  onSecondaryFixedVariant: "#888888",
  tertiary: "#e0e0e0",
  onTertiary: "#111111",
  tertiaryContainer: "#e0e0e0",
  onTertiaryContainer: "#111111",
  tertiaryFixed: "#111111",
  tertiaryFixedDim: "#888888",
  onTertiaryFixed: "#e0e0e0",
  onTertiaryFixedVariant: "#888888",
  error: dark.danger,
  onError: "#ffffff",
  errorContainer: "rgba(255,71,87,0.18)",
  onErrorContainer: "#ffffff",
  success: "#e0e0e0",
  successStrong: "#e0e0e0",
  successContainer: "#111111",
  onSuccessContainer: "#ffffff",
  emerald: "#e0e0e0",
  disabled: "#333333",
  disabledText: "#666666",
  cardSurface: "#1c1c1e",
  inputSurface: "#2c2c2e",
  fieldBorder: "#333333",
  verified: "#4ade80",
  surface80: "rgba(17,17,17,0.8)",
  surface85: "rgba(17,17,17,0.85)",
  surface20: "rgba(17,17,17,0.2)",
  surfaceContainerLowest95: "rgba(17,17,17,0.95)",
  surfaceContainerLowest90: "rgba(17,17,17,0.9)",
  surfaceContainerLow50: "rgba(17,17,17,0.5)",
  surfaceContainerHigh60: "rgba(17,17,17,0.6)",
  surfaceContainerHighest60: "rgba(17,17,17,0.6)",
  secondaryFixed40: "rgba(136,136,136,0.4)",
  secondaryFixed50: "rgba(136,136,136,0.5)",
  secondaryContainer40: "rgba(136,136,136,0.4)",
  tertiaryFixed40: "rgba(224,224,224,0.4)",
  inverseSurface40: "rgba(255,255,255,0.4)",
  inverseSurface80: "rgba(17,17,17,0.9)",
  errorContainer30: "rgba(255,71,87,0.18)",
  onPrimary20: "rgba(255,255,255,0.2)",
  headerShadow: "#000000",
  navShadow: "#000000",
  cardShadow: "#000000",
  cardShadowStrong: "#000000",
  sheetShadow: "#000000",
  keyShadow: "#000000",
};

const driverLight: Partial<ThemeColors> = {
  primary: "#007F46",
  primaryContainer: "#007F46",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#FFFFFF",
  primarySoft: "#EFFAF4",
  primaryFixed: "#D7F4E4",
  primaryFixedDim: "#A5DEC0",
  primaryFixedTint: "#E6F6ED",
  primaryFixedTintSoft: "#F1FAF5",
  onPrimaryFixed: "#002D19",
  onPrimaryFixedVariant: "#00552E",
  primary10: "rgba(0,127,70,0.10)",
  primary15: "rgba(0,127,70,0.15)",
  primaryTint: "rgba(0,127,70,0.10)",
  primaryTintStrong: "rgba(0,127,70,0.18)",
  primaryPressed: "#006638",
  primaryFixed20: "#EFFAF4",
  primaryFixed30: "#E6F6ED",
  primaryFixed40: "#DFF4E8",
  primaryFixed50: "#D7F4E4",
  surfaceTint: "#007F46",
  inversePrimary: "#7ED9AA",
};
const driverDark: Partial<ThemeColors> = {
  primary: "#7ED9AA",
  primaryContainer: "#7ED9AA",
  onPrimary: "#003820",
  onPrimaryContainer: "#003820",
  primarySoft: "#142E24",
  primaryFixed: "#1B3D2E",
  primaryFixedDim: "#2D634A",
  primaryFixedTint: "#172F25",
  primaryFixedTintSoft: "#13271F",
  onPrimaryFixed: "#C6F4DC",
  onPrimaryFixedVariant: "#A0E7C1",
  primary10: "rgba(126,217,170,0.10)",
  primary15: "rgba(126,217,170,0.15)",
  primaryTint: "rgba(126,217,170,0.12)",
  primaryTintStrong: "rgba(126,217,170,0.2)",
  primaryPressed: "#5CBF8F",
  primaryFixed20: "#13271F",
  primaryFixed30: "#172F25",
  primaryFixed40: "#193728",
  primaryFixed50: "#1B3D2E",
  surfaceTint: "#7ED9AA",
  inversePrimary: "#007F46",
};
const palettes = {
  customer: {
    light: colors,
    dark: darkColors,
  },
  driver: {
    light: { ...colors, ...driverLight },
    dark: {
      ...darkColors,
      ...driverDark,
      outline70: dark.textSecondary,
      driverHeader: dark.card,
    },
  },
};
export function getThemeColors(
  brand: ThemeBrand,
  isDark: boolean,
): ThemeColors {
  return palettes[brand][isDark ? "dark" : "light"];
}
function themeValue(brand: ThemeBrand, isDark: boolean) {
  const c = getThemeColors(brand, isDark);
  return {
    brand,
    dark: isDark,
    colors: c,
    tokens: {
      background: c.background,
      surface: c.surfaceContainerLowest,
      card: c.surfaceContainerLow,
      text: c.onSurface,
      textSecondary: c.onSurfaceVariant,
      border: c.outlineVariant,
      primary: c.primary,
      danger: c.error,
    },
  };
}
const Context = createContext(themeValue("customer", false));
export function ThemeProvider({
  mode = "system",
  brand = "customer",
  children,
}: {
  mode?: ThemeMode;
  brand?: ThemeBrand;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  const value = useMemo(() => themeValue(brand, isDark), [brand, isDark]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useTheme = () => useContext(Context);
export const useThemeColors = () => useTheme().colors;
export function useThemedStyles<T>(
  factory: ((colors: ThemeColors) => T) | T,
): T {
  const colors = useThemeColors();
  return useMemo(
    () =>
      typeof factory === "function"
        ? (factory as (colors: ThemeColors) => T)(colors)
        : factory,
    [factory, colors],
  );
}
