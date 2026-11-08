import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT, getPushPermissionStatus } from "@datxe/shared";
import {
  GroupedList,
  PaperTextInput as TextInput,
  localizedAlert,
  ScreenWrapper,
  useDebouncedTextChange,
  useLanguage,
  useThemeColors,
} from "@datxe/ui";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, Linking, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  List,
  RadioButton,
  Text,
} from "react-native-paper";

import { useSettings, type SavedPlace } from "@/lib/settings/SettingsProvider";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { resolveSavedPlace, searchSavedPlaces } from "../api";
const sections = {
  appearance: "Giao diện",
  notifications: "Thông báo",
  permissions: "Quyền ứng dụng",
  places: "Địa điểm đã lưu",
  about: "Về ứng dụng",
};
export default function SettingsScreen() {
  useLanguage();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const colors = useThemeColors();
  const settings = useMemo(() => createStyles(colors), [colors]);
  const { data, update } = useSettings();
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<
    Awaited<ReturnType<typeof searchSavedPlaces>>
  >([]);
  const [search, setSearch] = useState("");
  const [searchReset, setSearchReset] = useState(0);
  const [result, setResult] = useState<SavedPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const searchInput = useDebouncedTextChange((value) => {
    if (value === search) return;
    setSearch(value);
    setSuggestions([]);
    setResult(null);
    setError("");
    setBusy(value.trim().length >= 2);
  });
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
    return () => {
      controller.abort();
    };
  }, [search]);

  const row = (
    title: string,
    onPress?: () => void,
    subtitle?: string,
    right?: ReactNode,
    icon = "cog-outline",
    destructive = false,
  ) => (
    <List.Item
      key={title}
      title={i18nT(title)}
      description={subtitle ? i18nT(subtitle) : undefined}
      onPress={onPress}
      disabled={!onPress && busy}
      accessibilityRole={onPress ? "button" : undefined}
      titleNumberOfLines={2}
      titleStyle={[settings.rowTitle, destructive && { color: colors.error }]}
      descriptionStyle={settings.rowDescription}
      descriptionNumberOfLines={3}
      style={settings.row}
      left={(props) => (
        <List.Icon
          {...props}
          icon={icon}
          color={destructive ? colors.error : colors.primary}
        />
      )}
      right={(props) =>
        right ? (
          <View style={settings.trailing}>{right}</View>
        ) : onPress ? (
          <List.Icon
            {...props}
            icon="chevron-right"
            color={colors.onSurfaceVariant}
          />
        ) : null
      }
    />
  );
  const group = (title: string, children: ReactNode) => (
    <GroupedList title={title}>{children}</GroupedList>
  );
  const choice = (
    label: string,
    value: string,
    selected: string,
    onPress: () => void,
    icon: string,
  ) =>
    row(
      label,
      onPress,
      undefined,
      <RadioButton.Android
        value={value}
        status={selected === value ? "checked" : "unchecked"}
        onPress={onPress}
        accessibilityLabel={i18nT(label)}
      />,
      icon,
    );
  const validSection =
    section && section in sections
      ? (section as keyof typeof sections)
      : undefined;
  const openSection = (id: keyof typeof sections) => () =>
    router.push({ pathname: "/settings/[section]", params: { section: id } });
  const modeLabel = { system: "Theo hệ thống", light: "Sáng", dark: "Tối" }[
    data.mode
  ];

  // Removed or unknown sections must not recreate a settings sub-screen.
  if (section && !validSection) return <Redirect href="/settings" />;

  return (
    <ScreenWrapper style={settings.screen}>
      <ScreenHeader
        title={i18nT(validSection ? sections[validSection] : "Cài đặt")}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={settings.content}
        keyboardShouldPersistTaps="handled"
      >
        {!validSection ? (
          <>
            {group(
              "Giao diện",
              <>
                {row(
                  "Giao diện",
                  openSection("appearance"),
                  `${i18nT(modeLabel)} · ${data.language === "vi" ? "Tiếng Việt" : "English"}`,
                  undefined,
                  "palette-outline",
                )}
                <Divider style={settings.divider} />
                {row(
                  "Thông báo",
                  openSection("notifications"),
                  undefined,
                  undefined,
                  "bell-outline",
                )}
              </>,
            )}
            {group(
              "Tùy chọn ứng dụng",
              <>
                {row(
                  "Địa điểm đã lưu",
                  openSection("places"),
                  undefined,
                  undefined,
                  "map-marker-outline",
                )}
                <Divider style={settings.divider} />
                {row(
                  "Quyền ứng dụng",
                  openSection("permissions"),
                  undefined,
                  undefined,
                  "shield-check-outline",
                )}
              </>,
            )}
            {group(
              "Về ứng dụng",
              row(
                "Về ứng dụng",
                openSection("about"),
                Constants.expoConfig?.version ?? "1.0.0",
                undefined,
                "information-outline",
              ),
            )}
          </>
        ) : null}
        {validSection === "appearance" ? (
          <>
            {group(
              "CHỦ ĐỀ",
              <RadioButton.Group
                value={data.mode}
                onValueChange={(mode) =>
                  update({ mode: mode as typeof data.mode })
                }
              >
                {choice(
                  "Theo hệ thống",
                  "system",
                  data.mode,
                  () => update({ mode: "system" }),
                  "theme-light-dark",
                )}
                {choice(
                  "Sáng",
                  "light",
                  data.mode,
                  () => update({ mode: "light" }),
                  "white-balance-sunny",
                )}
                {choice(
                  "Tối",
                  "dark",
                  data.mode,
                  () => update({ mode: "dark" }),
                  "moon-waning-crescent",
                )}
              </RadioButton.Group>,
            )}
            {group(
              "NGÔN NGỮ",
              <RadioButton.Group
                value={data.language}
                onValueChange={(language) =>
                  update({ language: language as typeof data.language })
                }
              >
                {choice(
                  "Tiếng Việt",
                  "vi",
                  data.language,
                  () => update({ language: "vi" }),
                  "translate",
                )}
                {choice(
                  "English",
                  "en",
                  data.language,
                  () => update({ language: "en" }),
                  "translate",
                )}
              </RadioButton.Group>,
            )}
          </>
        ) : null}
        {validSection === "notifications"
          ? group(
              "Thông báo",
              row(
                "Thông báo",
                () => void Linking.openSettings(),
                permissions.notification === "granted"
                  ? "Đã cho phép"
                  : "Mở cài đặt hệ thống",
                undefined,
                "bell-outline",
              ),
            )
          : null}
        {validSection === "permissions"
          ? group(
              "Quyền ứng dụng",
              Object.entries({
                location: ["Vị trí", "map-marker-outline"],
                notification: ["Thông báo", "bell-outline"],
                camera: ["Camera bàn giao xe", "camera-outline"],
              }).map(([key, [title, icon]]) =>
                row(
                  title,
                  () => void Linking.openSettings(),
                  permissions[key] === "granted"
                    ? "Đã cho phép"
                    : permissions[key] === "denied"
                      ? "Đã từ chối — Mở cài đặt"
                      : "Chưa cấp quyền — Mở cài đặt",
                  undefined,
                  icon,
                ),
              ),
            )
          : null}
        {validSection === "places" ? (
          <>
            {group(
              "Tìm địa chỉ",
              <>
                <Text variant="bodyMedium" style={settings.helper}>
                  {i18nT(
                    "Tìm địa chỉ rồi lưu làm Nhà, Cơ quan hoặc yêu thích trên thiết bị này.",
                  )}
                </Text>
                <TextInput
                  mode="outlined"
                  label={i18nT("Tìm địa chỉ")}
                  key={searchReset}
                  left={<TextInput.Icon icon="magnify" />}
                  outlineStyle={settings.inputOutline}
                  style={settings.input}
                  onChangeText={searchInput.onChangeText}
                />
                {busy ? (
                  <ActivityIndicator
                    accessibilityLabel={i18nT("Đang tìm…")}
                    style={settings.loading}
                  />
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
                        .catch(() =>
                          setError(i18nT("Không xác định được tọa độ.")),
                        )
                        .finally(() => setBusy(false));
                    },
                    place.address,
                    undefined,
                    "map-marker-outline",
                  ),
                )}
              </>,
            )}
            {result
              ? group(
                  "Địa điểm đã lưu",
                  <>
                    <Text variant="bodyMedium" style={settings.helper}>
                      {result.address}
                    </Text>
                    <View style={settings.actions}>
                      {["Nhà", "Cơ quan", "Yêu thích"].map((name) => (
                        <Button
                          key={name}
                          mode="contained-tonal"
                          style={settings.pill}
                          onPress={() => {
                            update({
                              places: [
                                ...data.places.filter(
                                  (p) =>
                                    name === "Yêu thích" || p.name !== name,
                                ),
                                {
                                  ...result,
                                  id: Date.now() + ":" + Math.random(),
                                  name,
                                },
                              ],
                            });
                            searchInput.cancel();
                            setSearch("");
                            setBusy(false);
                            setSearchReset((revision) => revision + 1);
                            setResult(null);
                            setSuggestions([]);
                          }}
                        >
                          {i18nT("Lưu {0}", { 0: i18nT(name) })}
                        </Button>
                      ))}
                    </View>
                  </>,
                )
              : null}
            {data.places.length
              ? group(
                  "Địa điểm đã lưu",
                  data.places.map((place) =>
                    row(
                      place.name,
                      () =>
                        localizedAlert(i18nT("Xóa địa điểm?"), place.address, [
                          { text: "Hủy" },
                          {
                            text: "Xóa",
                            onPress: () =>
                              update({
                                places: data.places.filter(
                                  (p) => p.id !== place.id,
                                ),
                              }),
                          },
                        ]),
                      place.address,
                      undefined,
                      place.name === "Nhà"
                        ? "home-outline"
                        : place.name === "Cơ quan"
                          ? "briefcase-outline"
                          : "heart-outline",
                    ),
                  ),
                )
              : null}
          </>
        ) : null}
        {validSection === "about"
          ? group(
              "Về ứng dụng",
              <>
                {row(
                  "Phiên bản",
                  undefined,
                  Constants.expoConfig?.version ?? "1.0.0",
                  undefined,
                  "information-outline",
                )}
                <Divider style={settings.divider} />
                {row(
                  "Điều khoản",
                  () => router.push("/terms-of-service"),
                  undefined,
                  undefined,
                  "file-document-outline",
                )}
                {row(
                  "Chính sách bảo mật",
                  () => router.push("/privacy-policy"),
                  undefined,
                  undefined,
                  "shield-lock-outline",
                )}
                {row(
                  "Liên hệ hỗ trợ",
                  () => router.push("/support"),
                  undefined,
                  undefined,
                  "help-circle-outline",
                )}
              </>,
            )
          : null}
        {error ? (
          <Text accessibilityRole="alert" style={settings.error}>
            {i18nT(error)}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: 16,
      paddingBottom: 32,
      gap: 16,
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
    },
    row: { minHeight: 48, paddingVertical: 8, paddingHorizontal: 0, borderRadius: 24 },
    rowTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "500" },
    rowDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
    },
    trailing: { alignSelf: "center", justifyContent: "center" },
    divider: {
      backgroundColor: colors.surfaceVariant,
      marginLeft: 56,
      marginVertical: 4,
    },
    helper: {
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 22,
    },
    input: { backgroundColor: colors.inputSurface },
    inputOutline: { borderRadius: 24 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    pill: { borderRadius: 999, minHeight: 48, justifyContent: "center" },
    loading: { marginVertical: 16 },
    error: { color: colors.error, paddingHorizontal: 16 },
  });
