import { translate as i18nT } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Keyboard, Modal, StyleSheet, View } from "react-native";
import {
  MotionPressable as Pressable,
  Typography as Text,
  ThemedTextInput as TextInput,
} from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { useDebouncedTextChange } from "../useDebouncedTextChange";

import {
  formatNationalPhoneNumber,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from "@datxe/shared";
import { fontSize, spacing, typography } from "../theme/colors";

type Props = {
  defaultValue?: string;
  country: PhoneCountry;
  onChangeText: (value: string) => void;
  onSelectCountry: (country: PhoneCountry) => void;
  label?: string;
  /** Gợi ý trong ô nhập; mặc định lấy ví dụ số của quốc gia đang chọn. */
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  accessibilityLabel?: string;
};

export function PhoneNumberInput({
  defaultValue = "",
  country,
  onChangeText,
  onSelectCountry,
  label,
  placeholder,
  disabled = false,
  invalid = false,
  accessibilityLabel = i18nT("Số điện thoại"),
}: Props) {
  const language = useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const [value, setValue] = useState(defaultValue);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const searchInput = useDebouncedTextChange(setSearch);

  const filteredCountries = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (item) =>
        normalizeSearch(i18nT(item.name)).includes(query) ||
        item.iso2.toLowerCase().includes(query) ||
        item.dialCode.includes(query),
    );
  }, [search, language]);

  const changeNumber = (digits: string) => {
    setValue(digits);
    onChangeText(digits);
  };

  const closePicker = () => {
    searchInput.cancel();
    Keyboard.dismiss();
    setPickerVisible(false);
    setSearch("");
  };

  const selectCountry = (nextCountry: PhoneCountry) => {
    changeNumber(value.slice(0, nextCountry.maxLength));
    onSelectCountry(nextCountry);
    closePicker();
  };

  return (
    <>
      {label ? <Text style={styles.label}>{i18nT(label)}</Text> : null}
      <View style={[styles.inputRow, invalid && styles.inputRowInvalid]}>
        <Pressable
          accessibilityLabel={i18nT(
            i18nT("Chọn quốc gia, hiện tại {0} {1}", {
              "0": country.name,
              "1": country.dialCode,
            }),
          )}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => {
            Keyboard.dismiss();
            setPickerVisible(true);
          }}
          style={styles.countryButton}
        >
          <Text style={styles.flag}>{i18nT(country.flag)}</Text>
          <Text style={styles.dialCode}>{i18nT(country.dialCode)}</Text>
          <MaterialIcons
            color={colors.onSurfaceVariant}
            name="arrow-drop-down"
            size={fontSize.iconXl}
          />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          accessibilityLabel={i18nT(accessibilityLabel)}
          autoComplete="off"
          editable={!disabled}
          keyboardType="phone-pad"
          maxLength={country.maxLength + country.groups.length}
          onChangeText={(text) =>
            changeNumber(text.replace(/\D/g, "").slice(0, country.maxLength))
          }
          placeholder={i18nT(placeholder ?? country.example)}
          placeholderTextColor={colors.outline70}
          style={styles.phoneInput}
          value={formatNationalPhoneNumber(value, country)}
        />
        {value ? (
          <Pressable
            accessibilityLabel={i18nT("Xóa số đã nhập")}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => changeNumber("")}
            style={styles.clearButton}
          >
            <MaterialIcons
              color={colors.onSurfaceVariant}
              name="close"
              size={fontSize.icon16}
            />
          </Pressable>
        ) : null}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={closePicker}
        statusBarTranslucent
        transparent
        visible={pickerVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={i18nT("Đóng danh sách quốc gia")}
            accessibilityRole="button"
            onPress={closePicker}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {i18nT("Chọn quốc gia hoặc vùng lãnh thổ")}
              </Text>
              <Pressable
                accessibilityLabel={i18nT("Đóng")}
                accessibilityRole="button"
                onPress={closePicker}
                style={styles.closeButton}
              >
                <MaterialIcons
                  color={colors.onSurface}
                  name="close"
                  size={fontSize.iconXl}
                />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <MaterialIcons
                color={colors.onSurfaceVariant}
                name="search"
                size={fontSize.iconXl}
              />
              <TextInput
                accessibilityLabel={i18nT("Tìm quốc gia hoặc mã gọi")}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={searchInput.onChangeText}
                placeholder={i18nT("Tìm tên hoặc mã gọi")}
                placeholderTextColor={colors.outline70}
                style={styles.searchInput}
                key={pickerVisible ? "open" : "closed"}
              />
            </View>

            <FlatList
              keyboardShouldPersistTaps="always"
              data={filteredCountries}
              keyExtractor={(item) => item.iso2}
              keyboardDismissMode="none"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.iso2 === country.iso2 }}
                  onPress={() => selectCountry(item)}
                  style={styles.countryRow}
                >
                  <Text style={styles.rowFlag}>{i18nT(item.flag)}</Text>
                  <Text numberOfLines={1} style={styles.countryName}>
                    {i18nT(item.name)}
                  </Text>
                  <Text style={styles.rowDialCode}>{i18nT(item.dialCode)}</Text>
                  {item.iso2 === country.iso2 ? (
                    <MaterialIcons
                      color={colors.primary}
                      name="check"
                      size={fontSize.iconLg}
                    />
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {i18nT("Không tìm thấy quốc gia phù hợp.")}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      ...typography.labelLg,
      fontSize: 13,
      color: colors.onSurface,
      marginBottom: spacing.gap1_5,
    },
    inputRow: {
      minHeight: spacing.inputHeight,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 24,
      paddingHorizontal: spacing.px2_5,
    },
    inputRowInvalid: {
      borderColor: colors.error,
      backgroundColor: colors.errorContainer30,
    },
    countryButton: {
      minWidth: 94,
      minHeight: spacing.inputHeight - 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceXs,
      paddingHorizontal: spacing.spaceXs,
    },
    flag: { fontSize: fontSize.iconXl },
    dialCode: { ...typography.labelLg, color: colors.onSurface },
    divider: {
      width: spacing.phoneDividerWidth,
      height: spacing.phoneDividerHeight,
      backgroundColor: colors.outlineVariant,
      marginHorizontal: spacing.spaceXs,
    },
    phoneInput: {
      ...typography.bodyLg,
      fontSize: 15,
      color: colors.onSurface,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: spacing.spaceXs,
      paddingVertical: 0,
    },
    clearButton: {
      width: spacing.clearButton,
      height: spacing.clearButton,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
    },
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.scrim60,
    },
    sheet: {
      maxHeight: "82%",
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceSm,
      paddingBottom: spacing.spaceXl,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 999,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.secondaryFixedDim,
      alignSelf: "center",
      marginBottom: spacing.spaceMd,
    },
    sheetHeader: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.spaceSm,
    },
    sheetTitle: { ...typography.headlineSm, color: colors.onSurface, flex: 1 },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: spacing.spaceSm,
    },
    searchRow: {
      minHeight: spacing.inputHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 24,
      paddingHorizontal: spacing.spaceMd,
      marginBottom: spacing.spaceSm,
    },
    searchInput: {
      ...typography.bodyMd,
      color: colors.onSurface,
      flex: 1,
      minWidth: 0,
      padding: 0,
    },
    countryRow: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,

      paddingHorizontal: spacing.spaceXs,
    },
    rowFlag: { fontSize: fontSize.iconXl, width: 30 },
    countryName: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
    rowDialCode: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
      minWidth: 46,
      textAlign: "right",
    },
    emptyText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      paddingVertical: spacing.spaceXl,
    },
  });
