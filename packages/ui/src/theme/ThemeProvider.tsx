import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { colors } from "./colors";
export type ThemeMode = "system" | "light" | "dark";
export type ThemeBrand = "customer" | "driver";
export type ThemeColors = { [K in keyof typeof colors]: string };
const dark = {
  background: "#000000",
  surface: "#1E1E20",
  card: "#1E1E20",
  text: "#ffffff",
  textSecondary: "#C6C5CF",
  border: "#494950",
  primary: "#FFB2BF",
  danger: "#FFB4AB",
};
const darkColors = {
  ...colors,
  onSurfaceMuted: "#9CA3AF",
  outlineSubtle: "#2D2D30",
  safetyContainer: "#2A161A",
  onSafetyContainer: "#F2B8C6",
  background: dark.background,
  surface: dark.surface,
  surfaceDim: "#000000",
  surfaceBright: "#333337",
  surfaceContainerLowest: dark.surface,
  surfaceContainerLow: dark.card,
  surfaceContainer: dark.card,
  surfaceContainerHigh: "#29292D",
  surfaceContainerHighest: "#333337",
  surfaceVariant: "#29292D",
  onSurface: dark.text,
  onBackground: dark.text,
  onSurfaceVariant: dark.textSecondary,
  outline: dark.border,
  outlineVariant: dark.border,
  outline70: "rgba(136,136,136,0.7)",
  primary: dark.primary,
  primaryContainer: "#8F0038",
  onPrimary: "#650021",
  onPrimaryContainer: "#FFD9DF",
  primaryPressed: "#FFC5CE",
  primarySoft: "#321820",
  primaryFixed: "#FFD9DF",
  primaryFixedDim: "#FFB2BF",
  primaryFixedTint: "#321820",
  primaryFixedTintSoft: "#28151B",
  primaryFixed20: "rgba(255,71,87,0.10)",
  primaryFixed30: "rgba(255,71,87,0.14)",
  primaryFixed40: "rgba(255,71,87,0.18)",
  primaryFixed50: "rgba(255,71,87,0.22)",
  onPrimaryFixed: "#400012",
  onPrimaryFixedVariant: "#FFD9DF",
  primary10: "rgba(255,71,87,0.10)",
  primary15: "rgba(255,71,87,0.15)",
  primaryTint: "rgba(255,71,87,0.12)",
  primaryTintStrong: "rgba(255,71,87,0.2)",
  surfaceTint: "#ff4757",
  inversePrimary: "#B3263D",
  inverseSurface: "#ffffff",
  inverseOnSurface: "#1B1B1F",
  secondary: "#C6C5CF",
  onSecondary: "#303038",
  secondaryContainer: "#333337",
  onSecondaryContainer: "#E4E2EB",
  secondaryFixed: "#E4E2EB",
  secondaryFixedDim: "#C6C5CF",
  onSecondaryFixed: "#1B1B1F",
  onSecondaryFixedVariant: "#888888",
  tertiary: "#D4BCEB",
  onTertiary: "#3A2947",
  tertiaryContainer: "#513F60",
  onTertiaryContainer: "#EEDCFF",
  tertiaryFixed: "#EEDCFF",
  tertiaryFixedDim: "#D4BCEB",
  onTertiaryFixed: "#251431",
  onTertiaryFixedVariant: "#513F60",
  error: dark.danger,
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  success: "#9DD6B3",
  successStrong: "#9DD6B3",
  successContainer: "#124F30",
  onSuccessContainer: "#D0F1DC",
  emerald: "#e0e0e0",
  disabled: "#333333",
  disabledText: "#666666",
  cardSurface: "#1E1E20",
  inputSurface: "#1E1E20",
  fieldBorder: "#494950",
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
};

const driverLight: Partial<ThemeColors> = {
  primary: "#007F46",
  primaryContainer: "#C5F0D8",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#002112",
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
  driverHeader: "#1E1E1E",
  background: "#121212",
  surface: "#1E1E1E",
  surfaceContainerLowest: "#1E1E1E",
  surfaceContainerLow: "#1E1E1E",
  surfaceContainer: "#1E1E1E",
  cardSurface: "#1E1E1E",
  inputSurface: "#242424",
  rideBackground: "#121212",
  rideSurface: "#1E1E1E",
  rideInset: "#242424",
  warningContainer: "#362818",
  onWarningContainer: "#FFDC9B",
  primary: "#7ED9AA",
  primaryContainer: "#005233",
  onPrimary: "#003820",
  onPrimaryContainer: "#C5F0D8",
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
    dark: {
      ...darkColors,
      background: "#121212",
      surface: "#1E1E1E",
      surfaceContainerLowest: "#1E1E1E",
      surfaceContainerLow: "#1E1E1E",
      surfaceContainer: "#1E1E1E",
      cardSurface: "#1E1E1E",
      inputSurface: "#242424",
      rideBackground: "#121212",
      rideSurface: "#1E1E1E",
      rideInset: "#242424",
      warningContainer: "#362818",
      onWarningContainer: "#FFDC9B",
    },
  },
  driver: {
    light: { ...colors, ...driverLight },
    dark: {
      ...darkColors,
      ...driverDark,
      outline70: dark.textSecondary,
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
