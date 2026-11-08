import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import type { CustomerProfile } from "@datxe/shared";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  CustomDatePickerModal,
  localizedAlert,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  SectionHeading,
  Typography as Text,
  ThemedTextInput as TextInput,
  fontSize,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { usePreventRemove, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { accountStyles } from "../components/AccountScreenStyles";
import { useProfileEditor } from "../hooks/useProfileEditor";

/** Date → DD/MM/YYYY để hiển thị trong ô nhập. */
function dateToDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return [day, month, String(date.getFullYear())].join("/");
}

/** Ngày sinh phải nằm trong quá khứ, nên chặn chọn ở hôm qua. */
const MAX_BIRTH_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000);

/** ISO (YYYY-MM-DD) → hiển thị DD/MM/YYYY. */
function toDisplayDate(iso: string | null): string {
  const match = (iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : (iso ?? "");
}

/** DD/MM/YYYY → ISO để backend kiểm tra; giá trị sai được giữ nguyên để báo lỗi rõ ràng. */
function toIsoDate(display: string): string {
  const match = display.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : display.trim();
}

/** DD/MM/YYYY (hiển thị) → Date để mở lịch. */
function toDateValue(display: string): Date | null {
  const match = display.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const date = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function EditProfileScreen() {
  useLanguage();
  const h = useProfileEditor();
  const c = useThemeColors();
  const s = accountStyles(c);
  const router = useRouter();
  return (
    <SafeAreaView edges={["top"]} style={s.safe}>
      <ScreenHeader
        title={i18nT("Chỉnh sửa thông tin")}
        onBack={() => router.back()}
      />
      {h.query.data ? (
        <ProfileForm initial={h.query.data} />
      ) : (
        <View style={s.content}>
          {h.query.isLoading ? (
            <ActivityIndicator color={c.primary} />
          ) : (
            <>
              <Text style={s.error}>{i18nT("Không tải được hồ sơ.")}</Text>
              <Button
                label={i18nT("Thử lại")}
                onPress={() => void h.query.refetch()}
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function ProfileForm({ initial }: { initial: CustomerProfile }) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const c = useThemeColors(),
    s = accountStyles(c),
    router = useRouter(),
    insets = useSafeAreaInsets();
  const { save } = useProfileEditor();
  const seed = {
    name: initial.full_name ?? "",
    email: initial.email ?? "",
    birthDate: toDisplayDate(initial.date_of_birth),
    gender: initial.gender ?? "",
  };
  const [draft, setDraft] = useState(seed);
  // Track only the dirty flag in React; the editor keeps the composed name.
  const nameDraft = useRef(seed.name);
  const [nameDirty, setNameDirty] = useState(false);
  const [birthDatePickerVisible, setBirthDatePickerVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = nameDirty || Object.keys(seed).some(
    (key) =>
      draft[key as keyof typeof draft] !== seed[key as keyof typeof seed],
  );
  usePreventRemove((dirty || save.isPending) && !saved, ({ repeat }) => {
    if (save.isPending) return;
    localizedAlert(
      i18nT("Bỏ thay đổi?"),
      i18nT("Thông tin bạn vừa chỉnh sửa chưa được lưu."),
      [
        { text: "Tiếp tục sửa", style: "cancel" },
        {
          text: "Bỏ thay đổi",
          style: "destructive",
          onPress: () => {
            setSaved(true);
            repeat();
          },
        },
      ],
    );
  });
  const submit = async () => {
    if (save.isPending) return;
    try {
      await save.mutateAsync({
        ...draft,
        name: nameDraft.current,
        birthDate: toIsoDate(draft.birthDate),
      });
      setSaved(true);
      localizedAlert(
        i18nT("Đã lưu thông tin"),
        i18nT("Hồ sơ của bạn đã được cập nhật."),
        [{ text: "Hoàn tất", onPress: () => router.back() }],
      );
    } catch {}
  };
  return (
    <KeyboardAvoidingView
      style={extra.item1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.intro}>
          {i18nT("Cập nhật thông tin để chúng tôi hỗ trợ bạn tốt hơn.")}
        </Text>

        <View style={s.group}>
          <SectionHeading title="Thông tin cá nhân" />
          <View style={s.card}>
            <View style={s.field}>
              <Text style={s.label}>{i18nT("Họ và tên")}</Text>
              <View style={s.inputWrap}>
                <TextInput
                  accessibilityLabel={i18nT("Họ và tên")}
                  autoCapitalize="words"
                  editable={!save.isPending}
                  maxLength={255}
                  onChangeText={(value) => {
                    nameDraft.current = value;
                    setNameDirty(value !== seed.name);
                  }}
                  placeholder={i18nT("Nhập họ và tên")}
                  placeholderTextColor={c.onSurfaceVariant}
                  selectionColor={c.primary}
                  style={[s.input, s.inputPadded]}
                  defaultValue={draft.name}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputWrap}>
                <TextInput
                  accessibilityLabel="Email"
                  editable={false}
                  style={[s.input, s.inputPadded, s.inputReadonly]}
                  value={draft.email || i18nT("Chưa cập nhật email")}
                />
                <MaterialIcons
                  color={c.onSurfaceVariant}
                  name="lock"
                  size={fontSize.iconLg}
                  style={s.inputIcon}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>{i18nT("Ngày sinh")}</Text>
              <Pressable
                accessibilityLabel={i18nT("Ngày sinh")}
                accessibilityRole="button"
                disabled={save.isPending}
                onPress={() => setBirthDatePickerVisible(true)}
                style={s.dateRow}
              >
                <Text
                  style={[
                    s.dateText,
                    !draft.birthDate && s.dateTextPlaceholder,
                  ]}
                >
                  {draft.birthDate || i18nT("Chọn ngày sinh")}
                </Text>
                <MaterialIcons
                  color={c.onSurfaceVariant}
                  name="calendar-month"
                  size={fontSize.iconLg}
                />
              </Pressable>
            </View>

            <View style={s.field}>
              <Text style={s.label}>{i18nT("Giới tính")}</Text>
              <View style={s.choices}>
                {[
                  ["MALE", "Nam"],
                  ["FEMALE", i18nT("Nữ")],
                  ["OTHER", i18nT("Khác")],
                ].map(([value, label]) => {
                  const active = draft.gender === value;
                  return (
                    <Pressable
                      key={value}
                      disabled={save.isPending}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      onPress={() =>
                        setDraft((previous) => ({
                          ...previous,
                          gender: previous.gender === value ? "" : value,
                        }))
                      }
                      style={[s.choice, active && s.selected]}
                    >
                      <Text
                        style={[s.choiceText, active && s.choiceTextSelected]}
                      >
                        {i18nT(label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={s.group}>
          <SectionHeading title="Số điện thoại" />
          <View style={s.card}>
            <View style={s.phoneRow}>
              <Text style={s.title}>
                {initial.phone_number || i18nT("Chưa có số điện thoại")}
              </Text>
              {initial.phone_number ? (
                <MaterialIcons
                  accessibilityLabel={i18nT("Số điện thoại đã xác minh")}
                  color={c.verified}
                  name="check-circle"
                  size={fontSize.iconMd}
                />
              ) : null}
            </View>
            <Text style={s.intro}>
              {i18nT(
                "Số điện thoại đã xác minh được dùng để đăng nhập và liên hệ trong chuyến đi.",
              )}
            </Text>
          </View>
        </View>

        {save.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {i18nT(save.error.message)}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          disabled={!dirty || saved}
          label={i18nT(saved ? "Đã lưu" : "Lưu thay đổi")}
          loading={save.isPending}
          onPress={() => void submit()}
        />
      </View>

      <CustomDatePickerModal
        maximumDate={MAX_BIRTH_DATE}
        onCancel={() => setBirthDatePickerVisible(false)}
        onConfirm={(date) => {
          setDraft((previous) => ({
            ...previous,
            birthDate: dateToDisplay(date),
          }));
          setBirthDatePickerVisible(false);
        }}
        title={i18nT("Chọn ngày sinh")}
        value={toDateValue(draft.birthDate)}
        visible={birthDatePickerVisible}
      />
    </KeyboardAvoidingView>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { flex: 1 },
  });
