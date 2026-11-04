import { useTranslation } from "@/lib/settings/i18n";
import { translate as i18nT, getPushPermissionStatus, signOutFirebase } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  localizedAlert,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, ScrollView, StyleSheet, View } from "react-native";

import { useSettings, type SavedPlace } from "@/lib/settings/SettingsProvider";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  deleteCustomerAccount,
  resolveSavedPlace,
  searchSavedPlaces,
} from "../api";
const sections = {
  appearance: "Giao diện",
  notifications: "Thông báo",
  permissions: "Quyền ứng dụng",
  places: "Địa điểm đã lưu",
  account: "Tài khoản",
  about: "Về ứng dụng",
};
export default function SettingsScreen() {
  const settings = useThemedStyles(settingsStyles);

  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const t = useTranslation();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const colors = useThemeColors();
  const { data, update, clear } = useSettings();
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<
    Awaited<ReturnType<typeof searchSavedPlaces>>
  >([]);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<SavedPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(() => {
    void Promise.all([
      Location.getForegroundPermissionsAsync(),
      ImagePicker.getCameraPermissionsAsync(),
      getPushPermissionStatus(),
    ])
      .then(([location, camera, notification]) =>
        setPermissions({
          location: location.status,
          camera: camera.status,
          notification,
        }),
      )
      .catch(() => setError(i18nT("Chưa đọc được quyền hệ thống.")));
  }, []);
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );
  useEffect(() => {
    if (search.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      void searchSavedPlaces(search.trim(), controller.signal)
        .then((places) => {
          if (!controller.signal.aborted) setSuggestions(places);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(i18nT("Không tìm được địa chỉ."));
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);

  const row = (
    title: string,
    onPress?: () => void,
    subtitle?: string,
    right?: React.ReactNode,
  ) => (
    <Pressable key={title} onPress={onPress} style={settings.item1}>
      <MaterialIcons name="settings" size={22} color={colors.primary} />
      <View style={extra.item1}>
        <Text style={settings.item2}>{i18nT(t(title))}</Text>
        {subtitle ? (
          <Text style={settings.item3}>{i18nT(subtitle)}</Text>
        ) : null}
      </View>
      {right ?? (
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.onSurfaceVariant}
        />
      )}
    </Pressable>
  );
  const leave = async (remove = false) => {
    setBusy(true);
    setError("");
    try {
      if (remove) await deleteCustomerAccount();
      await clear();
      await signOutFirebase();
      router.replace("/(auth)/login");
    } catch {
      setError(i18nT("Không thể hoàn tất. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  };
  const deleteAccount = () =>
    localizedAlert(
      i18nT("Xóa tài khoản?"),
      i18nT("Dữ liệu tài khoản sẽ bị xóa theo chính sách dịch vụ."),
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          style: "destructive",
          onPress: () =>
            localizedAlert(
              i18nT("Xác nhận lần cuối"),
              i18nT("Bạn chắc chắn muốn xóa tài khoản?"),
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Xóa vĩnh viễn",
                  style: "destructive",
                  onPress: () => void leave(true),
                },
              ],
            ),
        },
      ],
    );
  return (
    <SafeAreaView style={settings.item4}>
      <View style={extra.item2}>
        <Pressable
          accessibilityLabel={i18nT("Quay lại")}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={settings.item5}>
          {i18nT(
            section
              ? t(sections[section as keyof typeof sections])
              : data.language === "en"
                ? "Settings"
                : "Cài đặt",
          )}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={extra.item3}
        keyboardShouldPersistTaps="handled"
      >
        {!section
          ? Object.entries(sections).map(([id, title]) =>
              row(title, () =>
                router.push({
                  pathname: "/settings/[section]" as never,
                  params: { section: id },
                }),
              ),
            )
          : null}
        {section === "appearance" ? (
          <>
            {row(i18nT("CHỦ ĐỀ"), undefined, undefined, <View />)}
            {(["system", "light", "dark"] as const).map((mode, i) =>
              row(
                [i18nT("Theo hệ thống"), i18nT("Sáng"), i18nT("Tối")][i],
                () => update({ mode }),
                undefined,
                <Text style={settings.item6}>
                  {i18nT(data.mode === mode ? "✓" : "")}
                </Text>,
              ),
            )}
            {row(i18nT("NGÔN NGỮ"), undefined, undefined, <View />)}
            {(["vi", "en"] as const).map((language, i) =>
              row(
                [i18nT("Tiếng Việt"), "English"][i],
                () => update({ language }),
                undefined,
                <Text style={settings.item7}>
                  {i18nT(data.language === language ? "✓" : "")}
                </Text>,
              ),
            )}
          </>
        ) : null}
        {section === "notifications" ? (
          <>
            {row(
              i18nT("Thông báo"),
              () => void Linking.openSettings(),
              permissions.notification === "granted"
                ? i18nT("Đã cho phép")
                : i18nT("Mở cài đặt hệ thống"),
            )}
          </>
        ) : null}
        {section === "permissions"
          ? Object.entries({
              location: "Vị trí",
              notification: "Thông báo",
              camera: "Camera bàn giao xe",
            }).map(([key, title]) =>
              row(
                title,
                () => void Linking.openSettings(),
                permissions[key] === "granted"
                  ? i18nT("Đã cho phép")
                  : permissions[key] === "denied"
                    ? i18nT("Đã từ chối — Mở cài đặt")
                    : i18nT("Chưa cấp quyền — Mở cài đặt"),
              ),
            )
          : null}
        {section === "places" ? (
          <>
            <Text style={settings.item8}>
              {i18nT(
                "Tìm địa chỉ rồi lưu làm Nhà, Cơ quan hoặc yêu thích trên thiết bị này.",
              )}
            </Text>
            <TextInput
              placeholder={i18nT("Tìm địa chỉ")}
              placeholderTextColor={colors.onSurfaceVariant}
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setSuggestions([]);
                setResult(null);
                setError("");
              }}
              style={settings.item9}
            />
            {busy ? (
              <Text style={settings.item10}>{i18nT("Đang tìm…")}</Text>
            ) : null}
            {suggestions.map((place) =>
              row(
                place.name,
                () => {
                  setBusy(true);
                  void resolveSavedPlace(place)
                    .then((resolved) => {
                      setResult({ ...resolved, id: String(Date.now()) });
                      setSuggestions([]);
                    })
                    .catch(() => setError(i18nT("Không xác định được tọa độ.")))
                    .finally(() => setBusy(false));
                },
                place.address,
              ),
            )}
            {result
              ? ["Nhà", "Cơ quan", "Yêu thích"].map((name) =>
                  row(
                    i18nT("Lưu {0}", { 0: i18nT(name) }),
                    () => {
                      update({
                        places: [
                          ...data.places.filter(
                            (p) => name === "Yêu thích" || p.name !== name,
                          ),
                          {
                            ...result,
                            id: Date.now() + ":" + Math.random(),
                            name,
                          },
                        ],
                      });
                      setSearch("");
                    },
                    result.address,
                  ),
                )
              : null}
            {data.places.map((place) =>
              row(
                place.name,
                () =>
                  localizedAlert(i18nT("Xóa địa điểm?"), place.address, [
                    { text: "Hủy" },
                    {
                      text: "Xóa",
                      onPress: () =>
                        update({
                          places: data.places.filter((p) => p.id !== place.id),
                        }),
                    },
                  ]),
                place.address,
              ),
            )}
          </>
        ) : null}
        {section === "account" ? (
          <>
            {row(i18nT("Xem / sửa thông tin"), () =>
              router.push("/edit-profile"),
            )}
            {row(i18nT("Đăng xuất"), () =>
              localizedAlert(
                i18nT("Đăng xuất?"),
                i18nT("Bạn muốn kết thúc phiên đăng nhập?"),
                [
                  { text: "Hủy" },
                  { text: "Đăng xuất", onPress: () => void leave() },
                ],
              ),
            )}
            {row(
              i18nT("Xóa tài khoản"),
              busy ? undefined : deleteAccount,
              i18nT("Yêu cầu xác nhận hai bước"),
            )}
          </>
        ) : null}
        {section === "about" ? (
          <>
            {row(
              i18nT("Phiên bản"),
              undefined,
              Constants.expoConfig?.version ?? "1.0.0",
              <View />,
            )}
            {row(i18nT("Điều khoản"), () => router.push("/terms-of-service"))}
            {row(i18nT("Chính sách bảo mật"), () =>
              router.push("/privacy-policy"),
            )}
            {row(i18nT("Liên hệ hỗ trợ"), () => router.push("/support"))}
          </>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={settings.item11}>
            {i18nT(error)}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { flex: 1 },
    item2: { flexDirection: "row", padding: 18, gap: 16, alignItems: "center" },
    item3: { padding: 18 },
  });

const settingsStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      backgroundColor: colors.surfaceContainerLow,
      padding: 18,
      borderRadius: 18,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    item2: { color: colors.onSurface, fontSize: 16, fontWeight: "600" },
    item3: { color: colors.onSurfaceVariant, marginTop: 5 },
    item4: { flex: 1, backgroundColor: colors.background },
    item5: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
    item6: { color: colors.primary },
    item7: { color: colors.primary },
    item8: { color: colors.onSurfaceVariant, marginBottom: 12 },
    item9: {
      backgroundColor: colors.surfaceContainerLow,
      color: colors.onSurface,
      padding: 18,
      borderRadius: 16,
    },
    item10: { color: colors.onSurfaceVariant },
    item11: { color: colors.error },
  });
