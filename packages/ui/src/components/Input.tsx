import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { PaperTextInput as PaperInput } from "./PaperTextInput";
import { useThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
type IconName = keyof typeof MaterialIcons.glyphMap;

export type InputProps = {
  defaultValue?: string;
  draftValue?: string;
  value?: string;
  onChangeText: (text: string) => void;
  label?: string;
  /** Nội dung hiển thị bên phải dòng label, ví dụ liên kết "Quên mật khẩu?". */
  labelAccessory?: ReactNode;
  placeholder?: string;
  /** Icon MaterialIcons hiển thị bên trái ô nhập. */
  icon?: IconName;
  /** Bật chế độ mật khẩu kèm nút hiện/ẩn ở bên phải. */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  maxLength?: number;
  editable?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
  defaultValue,
  draftValue,
  value,
  onChangeText,
  label,
  labelAccessory,
  placeholder,
  icon,
  secure = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  maxLength,
  editable,
  accessibilityLabel,
  style,
  inputStyle,
}: InputProps) {
  useLanguage();
  const colors = useThemeColors();
  const [secureVisible, setSecureVisible] = useState(false);
  return (
    <View style={styles.field}>
      {labelAccessory ? (
        <View style={styles.labelRow}>
          <Text variant="labelLarge">{i18nT(label)}</Text>
          {labelAccessory}
        </View>
      ) : null}
      <PaperInput
        mode="outlined"
        label={labelAccessory ? undefined : i18nT(label)}
        accessibilityLabel={i18nT(accessibilityLabel ?? label)}
        defaultValue={defaultValue}
        draftValue={draftValue}
        value={value}
        onChangeText={onChangeText}
        placeholder={i18nT(placeholder)}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        maxLength={maxLength}
        secureTextEntry={secure && !secureVisible}
        left={
          icon ? (
            <PaperInput.Icon
              icon={(props) => <MaterialIcons {...props} name={icon} />}
            />
          ) : undefined
        }
        right={
          secure ? (
            <PaperInput.Icon
              accessibilityLabel={i18nT("Hiện hoặc ẩn mật khẩu")}
              icon={(props) => (
                <MaterialIcons
                  {...props}
                  name={secureVisible ? "visibility-off" : "visibility"}
                />
              )}
              onPress={() => setSecureVisible((visible) => !visible)}
            />
          ) : undefined
        }
        style={[{ backgroundColor: colors.inputSurface }, style]}
        outlineStyle={styles.outline}
        contentStyle={[styles.content, inputStyle]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 8 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outline: { borderRadius: 24 },
  content: { minHeight: 56, fontSize: 16 },
});
