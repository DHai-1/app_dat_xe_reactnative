import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import type { ThemeColors } from "./ThemeProvider";

/** Shared semantic roles keep Paper and existing app styles on the same palette. */
export function createMaterialTheme(
  colors: ThemeColors,
  dark: boolean,
): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 6,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primaryContainer,
      onPrimaryContainer: colors.onPrimaryContainer,
      secondary: colors.secondary,
      onSecondary: colors.onSecondary,
      secondaryContainer: colors.secondaryContainer,
      onSecondaryContainer: colors.onSecondaryContainer,
      tertiary: colors.tertiary,
      onTertiary: colors.onTertiary,
      tertiaryContainer: colors.tertiaryContainer,
      onTertiaryContainer: colors.onTertiaryContainer,
      error: colors.error,
      onError: colors.onError,
      errorContainer: colors.errorContainer,
      onErrorContainer: colors.onErrorContainer,
      background: colors.background,
      onBackground: colors.onBackground,
      surface: colors.cardSurface,
      onSurface: colors.onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      inverseSurface: colors.inverseSurface,
      inverseOnSurface: colors.inverseOnSurface,
      inversePrimary: colors.inversePrimary,
    },
  };
}
