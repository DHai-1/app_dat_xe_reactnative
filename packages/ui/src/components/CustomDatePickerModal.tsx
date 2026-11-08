import { translate as i18nT } from "@datxe/shared";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { MotionPressable as Pressable } from "./MotionPressable";
import { Typography as Text } from "./Typography";

import { spacing, typography } from "../theme/colors";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

export type CustomDatePickerModalProps = {
  visible: boolean;
  /** Tiêu đề giữa header, ví dụ "Chọn ngày sinh". */
  title: string;
  value: Date | null;
  onConfirm: (selectedDate: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

type WheelProps = {
  values: number[];
  selected: number;
  onSelect: (index: number) => void;
  format?: (value: number) => string;
};

/** Một cột wheel: snap từng item, item giữa được highlight. */
function Wheel({ values, selected, onSelect, format }: WheelProps) {
  const styles = useThemedStyles(base_styles);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    onSelect(Math.min(Math.max(index, 0), values.length - 1));
  };

  return (
    <FlatList
      contentContainerStyle={styles.wheelContent}
      data={values}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={selected}
      keyExtractor={(item) => String(item)}
      onMomentumScrollEnd={settle}
      onScrollEndDrag={settle}
      renderItem={({ item, index }) => (
        <View style={styles.wheelItem}>
          <Text
            style={[
              styles.wheelText,
              index === selected && styles.wheelTextSelected,
            ]}
          >
            {format ? format(item) : String(item)}
          </Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      style={styles.wheel}
      windowSize={3}
    />
  );
}

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function CustomDatePickerModal({
  visible,
  title,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
}: CustomDatePickerModalProps) {
  useLanguage();

  const styles = useThemedStyles(base_styles);
  const insets = useSafeAreaInsets();

  const min = minimumDate ? startOfDay(minimumDate) : null;
  const max = maximumDate ? startOfDay(maximumDate) : null;

  // Dùng timestamp làm dependency để tránh reset wheel khi parent truyền Date mới mỗi render.
  const valueTime = value ? startOfDay(value).getTime() : null;
  const minTime = min ? min.getTime() : null;
  const maxTime = max ? max.getTime() : null;

  // Mốc mặc định: giá trị đang có, hoặc hôm nay (đã kẹp trong khoảng cho phép).
  const initial = useMemo(() => {
    const fallback =
      max && max.getTime() < Date.now()
        ? max
        : min && min.getTime() > Date.now()
          ? min
          : new Date();
    const base = value ? startOfDay(value) : fallback;
    const clamped = new Date(base);
    if (min && clamped.getTime() < min.getTime())
      clamped.setTime(min.getTime());
    if (max && clamped.getTime() > max.getTime())
      clamped.setTime(max.getTime());
    return clamped;
  }, [valueTime, minTime, maxTime]);

  const [day, setDay] = useState(initial.getDate());
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear] = useState(initial.getFullYear());

  // Mỗi lần mở lại: nạp lại giá trị hiện tại cho cả 3 cột.
  useEffect(() => {
    if (!visible) return;
    setDay(initial.getDate());
    setMonth(initial.getMonth());
    setYear(initial.getFullYear());
  }, [visible, initial]);

  const years = useMemo(() => {
    const from = min ? min.getFullYear() : initial.getFullYear() - 100;
    const to = max ? max.getFullYear() : new Date().getFullYear();
    return Array.from(
      { length: Math.max(to - from + 1, 1) },
      (_, i) => from + i,
    );
  }, [minTime, maxTime, initial]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  const days = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
    [year, month],
  );

  // Đổi tháng/năm có thể làm ngày vượt quá số ngày của tháng đó.
  useEffect(() => {
    if (day > days.length) setDay(days.length);
  }, [day, days.length]);

  const confirm = () => {
    const selected = new Date(
      year,
      month,
      Math.min(day, days.length),
      12,
      0,
      0,
    );
    onConfirm(selected);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={i18nT("Đóng")}
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.spaceLg },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={styles.headerAction}
            >
              <Text style={styles.cancelText}>{i18nT("Hủy")}</Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {i18nT(title)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={confirm}
              style={styles.headerAction}
            >
              <Text style={styles.confirmText}>{i18nT("Xác nhận")}</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.captions}>
              <Text style={styles.caption}>{i18nT("Ngày")}</Text>
              <Text style={styles.caption}>{i18nT("Tháng")}</Text>
              <Text style={styles.caption}>{i18nT("Năm")}</Text>
            </View>
            <View style={styles.wheelBlock}>
              <View pointerEvents="none" style={styles.highlight} />
              <View style={styles.columns}>
                <View style={styles.column}>
                  <Wheel
                    key={`day-${days.length}`}
                    onSelect={(index) => setDay(days[index])}
                    selected={Math.min(day, days.length) - 1}
                    values={days}
                  />
                </View>
                <View style={styles.column}>
                  <Wheel
                    key={`month`}
                    format={(index) => String(index + 1).padStart(2, "0")}
                    onSelect={(index) => setMonth(months[index])}
                    selected={month}
                    values={months}
                  />
                </View>
                <View style={styles.column}>
                  <Wheel
                    key={`year`}
                    onSelect={(index) => setYear(years[index])}
                    selected={Math.max(years.indexOf(year), 0)}
                    values={years}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.scrim60,
    },
    backdrop: { ...StyleSheet.absoluteFill },
    sheetRoot: { width: "100%" },
    sheet: {
      backgroundColor: colors.cardSurface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingBottom: spacing.spaceLg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
      paddingHorizontal: spacing.spaceMd,
      paddingVertical: spacing.px3_5,
    },
    headerAction: {
      minWidth: spacing.iconButtonLg,
      minHeight: 44,
      justifyContent: "center",
    },
    headerTitle: {
      ...typography.titleMd,
      flex: 1,
      textAlign: "center",
      color: colors.onSurface,
    },
    cancelText: {
      ...typography.bodyLgMedium,
      color: colors.onSurfaceVariant,
    },
    confirmText: {
      ...typography.bodyLgMedium,
      color: colors.primary,
      fontWeight: "700",
      textAlign: "right",
    },
    body: { paddingTop: spacing.px3, paddingBottom: spacing.px3 },
    captions: {
      flexDirection: "row",
      paddingHorizontal: spacing.spaceMd,
      gap: spacing.spaceSm,
      marginBottom: spacing.spaceXs,
    },
    wheelBlock: { height: WHEEL_HEIGHT, justifyContent: "center" },
    highlight: {
      position: "absolute",
      left: spacing.spaceMd,
      right: spacing.spaceMd,
      top: WHEEL_PADDING,
      height: ITEM_HEIGHT,
      borderRadius: 24,
      backgroundColor: colors.inputSurface,
    },
    columns: {
      flexDirection: "row",
      paddingHorizontal: spacing.spaceMd,
      gap: spacing.spaceSm,
    },
    column: { flex: 1, height: WHEEL_HEIGHT },
    caption: {
      ...typography.labelSm,
      flex: 1,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    wheel: { height: WHEEL_HEIGHT },
    wheelContent: { paddingVertical: WHEEL_PADDING },
    wheelItem: {
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    wheelText: {
      ...typography.headlineSm,
      color: colors.onSurfaceVariant,
    },
    wheelTextSelected: {
      color: colors.onSurface,
      fontWeight: "700",
    },
  });
