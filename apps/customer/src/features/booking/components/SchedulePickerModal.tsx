import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, View } from "react-native";

import { bookingStyles as base_s } from "./bookingStyles";
export function SchedulePickerModal({
  visible,
  close,
  slots,
  selected,
  onSelect,
}: {
  visible: boolean;
  close: () => void;
  slots: string[];
  selected: string | null;
  onSelect: (slot: string | null) => void;
}) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={extra.item1}>
        <Pressable
          style={extra.item2}
          onPress={close}
          accessibilityLabel={i18nT("Đóng lịch đón")}
        />
        <SafeAreaView edges={["bottom"]} style={[s.sheet, extra.item3]}>
          <View style={s.between}>
            <Text style={s.title}>{i18nT("Bạn muốn đi lúc nào?")}</Text>
            <Pressable
              onPress={close}
              accessibilityLabel={i18nT("Đóng")}
              hitSlop={12}
            >
              <MaterialIcons name="close" size={24} />
            </Pressable>
          </View>
          <ScrollView>
            <Pressable onPress={() => onSelect(null)} style={s.listItem}>
              <MaterialIcons
                name={
                  !selected ? "radio-button-checked" : "radio-button-unchecked"
                }
                size={22}
                color={colors.primary}
              />
              <Text style={s.text}>{i18nT("Đi ngay bây giờ")}</Text>
            </Pressable>
            {slots.map((slot) => (
              <Pressable
                key={slot}
                onPress={() => onSelect(slot)}
                style={s.listItem}
              >
                <MaterialIcons
                  name={
                    slot === selected
                      ? "radio-button-checked"
                      : "radio-button-unchecked"
                  }
                  size={22}
                  color={colors.primary}
                />
                <Text style={s.text}>
                  {i18nT(
                    new Date(slot).toLocaleString(getLocale(), {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  )}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      flex: 1,
      backgroundColor: colors.scrim60,
      justifyContent: "flex-end",
    },
    item2: { flex: 1 },
    item3: { maxHeight: "80%" },
  });
