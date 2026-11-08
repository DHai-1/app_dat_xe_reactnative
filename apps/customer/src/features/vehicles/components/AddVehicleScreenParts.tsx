import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  spacing,
  Typography as Text,
  ThemedTextInput as TextInput,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
export function Field({
  label,
  value,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "numeric";
  maxLength?: number;
}) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();

  const colors = useThemeColors();

  return (
    <View style={themed_styles.group}>
      <Text style={themed_styles.label}>{i18nT(label)}</Text>
      <TextInput
        {...props}
        draftValue={value}
        style={themed_styles.input}
        placeholderTextColor={colors.outline}
      />
    </View>
  );
}

export function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const themed_styles = useThemedStyles(styles);

  useLanguage();

  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[themed_styles.choice, active && themed_styles.choiceActive]}
    >
      <MaterialIcons
        name={active ? "radio-button-checked" : "radio-button-unchecked"}
        size={19}
        color={active ? colors.primary : colors.outline}
      />
      <Text
        style={[
          themed_styles.choiceText,
          active && themed_styles.choiceTextActive,
        ]}
      >
        {i18nT(label)}
      </Text>
    </Pressable>
  );
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    fill: { flex: 1 },
    card: { gap: 12 },
    footer: { padding: 16, backgroundColor: colors.cardSurface },
    content: { padding: spacing.margin, gap: 16, paddingBottom: 34 },
    intro: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    group: { gap: 8 },
    label: { ...typography.labelMd, color: colors.onSurface },
    input: {
      ...typography.bodyLg,
      minHeight: 48,
      color: colors.onSurface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 24,
      backgroundColor: colors.inputSurface,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    choices: { flexDirection: "row", gap: 8 },
    photoPicker: {
      minHeight: 74,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,

      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    existingImageRow: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 8,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    deleteImage: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    photoPreview: { width: 52, height: 52, borderRadius: 24 },
    photoText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    choice: {
      flex: 1,
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: 6,
    },
    choiceActive: {
      backgroundColor: colors.primaryFixedTint,
    },
    choiceText: { ...typography.labelMd, color: colors.onSurfaceVariant },
    choiceTextActive: { color: colors.primary },
    primary: {
      minHeight: 54,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    primaryText: { ...typography.labelLg, color: colors.onPrimary },
    disabled: { opacity: 0.6 },
  });
