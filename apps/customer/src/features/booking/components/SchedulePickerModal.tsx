import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  ScreenWrapper,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  createScheduleSlots,
  formatScheduledPickup,
  formatScheduleTime,
  groupScheduleSlots,
  scheduleDayKey,
  type SchedulePickerSession,
} from "../bookingUtils";
import { bookingStyles } from "./bookingStyles";

type SchedulePickerProps = {
  visible: boolean;
  close: () => void;
  session: SchedulePickerSession | null;
  selected: string | null;
  onSelect: (slot: string | null) => void;
};

const gridGap = 8;
const sheetPadding = 16;

export function SchedulePickerModal({ visible, close, session, selected, onSelect }: SchedulePickerProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={close} />
        {session && (
          <ScheduleChoices key={session.referenceTime} session={session} selected={selected} close={close} onSelect={onSelect} />
        )}
      </View>
    </Modal>
  );
}

function ScheduleChoices({ session, selected, close, onSelect }: Omit<SchedulePickerProps, "visible" | "session"> & { session: SchedulePickerSession }) {
  useLanguage();
  const styles = useThemedStyles(createStyles);
  const base = useThemedStyles(bookingStyles);
  const colors = useThemeColors();
  const { width, fontScale } = useWindowDimensions();
  const { referenceTime, expired } = session;
  const days = groupScheduleSlots(createScheduleSlots(referenceTime), referenceTime);
  const selectedExpired = selected !== null && Date.parse(selected) <= referenceTime;
  const current = selectedExpired ? null : selected;
  const selectedDay = current ? days.find(day => day.key === scheduleDayKey(current)) : undefined;
  const [dayKey, setDayKey] = useState(() => (selectedDay ?? days[0]).key);
  const day = days.find(option => option.key === dayKey) ?? days[0];
  const gridWidth = width - 2 * sheetPadding;
  const columns = Math.max(1, Math.min(4, Math.floor((gridWidth + gridGap) / (72 * Math.max(1, fontScale) + gridGap))));
  const slotWidth = Math.floor((gridWidth - (columns - 1) * gridGap) / columns);
  const slotHeight = Math.max(48, Math.ceil(22 * fontScale) + 16);
  const selectedIndex = current ? day.slots.indexOf(current) : -1;
  const initialOffset = Math.floor(Math.max(0, selectedIndex) / columns) * (slotHeight + gridGap);

  return (
    <ScreenWrapper edges={["bottom"]} style={[base.sheet, styles.sheet]} accessibilityViewIsModal>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[base.title, styles.title]}>{i18nT("Chọn giờ đón")}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={i18nT("Đóng")} onPress={close} style={styles.close}>
          <MaterialIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={i18nT("Đi ngay")}
        accessibilityState={{ checked: selected === null }}
        style={[styles.instant, selected === null && styles.selected]}
        onPress={() => onSelect(null)}
      >
        <MaterialIcons name="bolt" size={22} color={colors.primary} />
        <Text style={[base.text, styles.grow]}>{i18nT("Đi ngay")}</Text>
        {selected === null && <MaterialIcons name="check" size={20} color={colors.primary} />}
      </Pressable>

      {(expired || selectedExpired) && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[base.muted, styles.alert]}>
          {i18nT("Giờ hẹn đã qua. Hãy chọn lại thời gian đón.")}
        </Text>
      )}
      {current && !selectedDay?.slots.includes(current) && (
        <View style={[styles.instant, styles.selected]}>
          <MaterialIcons name="check" size={18} color={colors.primary} />
          <Text style={[base.muted, styles.grow]}>{i18nT("Đang chọn {0}", { "0": formatScheduledPickup(current) })}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={base.label}>{i18nT("Đặt trước · Giờ Việt Nam")}</Text>
        <View style={styles.dayTabs} accessibilityRole="tablist">
          {days.map(option => (
            <Pressable
              key={option.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: option.key === day.key }}
              onPress={() => setDayKey(option.key)}
              style={[styles.day, option.key === day.key && styles.selected]}
            >
              <Text style={[base.label, option.key === day.key && styles.accent]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        key={day.key + "-" + columns}
        contentContainerStyle={styles.grid}
        contentOffset={{ x: 0, y: initialOffset }}
        style={styles.times}
      >
        {day.slots.map(slot => {
          const checked = slot === current;
          const time = formatScheduleTime(slot);
          return (
            <Pressable
              key={slot}
              accessibilityRole="radio"
              accessibilityLabel={time + ", " + day.label}
              accessibilityState={{ checked }}
              onPress={() => onSelect(slot)}
              style={[styles.slot, { width: slotWidth, height: slotHeight }, checked && styles.selected]}
            >
              <Text style={[base.text, styles.time, checked && styles.accent]}>{time}</Text>
              {checked && <MaterialIcons name="check" size={16} color={colors.primary} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.scrim60 },
  sheet: { flex: 0, maxHeight: "86%", padding: sheetPadding, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, lineHeight: 30 },
  grow: { flex: 1 },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  instant: {
    minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.surfaceContainerHigh,
  },
  section: { gap: 6 },
  dayTabs: { flexDirection: "row", flexWrap: "wrap", gap: gridGap },
  day: {
    minHeight: 48, maxWidth: "100%", justifyContent: "center", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 24, backgroundColor: colors.surfaceContainerHigh,
  },
  times: { flexGrow: 0, flexShrink: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: gridGap },
  slot: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 4,
    borderRadius: 12, backgroundColor: colors.surfaceContainerHigh,
  },
  time: { fontWeight: "600", lineHeight: 22, fontVariant: ["tabular-nums"] },
  selected: { backgroundColor: colors.primarySoft },
  accent: { color: colors.primary },
  alert: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, padding: 10, borderRadius: 12 },
});
