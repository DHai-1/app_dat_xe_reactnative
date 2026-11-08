import { customerType } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  GroupedList,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useRef, useState, type ComponentRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { bookingStyles as base_s } from "../components/bookingStyles";
import { usePlaceSelection } from "../hooks/usePlaceSelection";
import type { PlaceKind } from "../types";

export default function PlaceSelectionScreen({ kind }: { kind: PlaceKind }) {
  const extra = useThemedStyles(extraStyles);
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const h = usePlaceSelection(kind);
  const [searchPreset, setSearchPreset] = useState({ text: h.initialText, revision: 0 });
  const fillRecentAddress = (address: string) => {
    setSearchPreset((previous) => ({ text: address, revision: previous.revision + 1 }));
    h.onChangeText(address);
  };
  const isPickup = kind === "pickup";
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT(isPickup ? "Chọn điểm đón" : "Bạn muốn đến đâu?")}
        onBack={() => h.router.back()}
      />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[s.page, extra.item1]}>
          <Text style={s.label}>
            {i18nT("Bước")} {i18nT(isPickup ? "1" : "2")}/4 ·{" "}
            {i18nT(isPickup ? "Điểm đón" : "Điểm đến")}
          </Text>
          {!isPickup && h.pickup ? (
            <View style={s.row}>
              <MaterialIcons
                name="radio-button-checked"
                size={14}
                color={colors.success}
              />
              <Text style={[s.muted, s.flex]} numberOfLines={1}>
                {i18nT("Từ")} {h.pickup.address}
              </Text>
            </View>
          ) : null}
          <View style={s.searchBox}>
            <MaterialIcons name="search" size={23} color={colors.primary} />
            <TextInput
              accessibilityLabel={i18nT(
                isPickup ? "Tìm điểm đón" : "Tìm điểm đến",
              )}
              ref={searchInput}
              key={searchPreset.revision}
              defaultValue={searchPreset.text}
              onChangeText={h.onChangeText}
              placeholder={i18nT("Tìm tên đường, địa chỉ, địa điểm…")}
              maxLength={255}
              style={s.search}
              returnKeyType="search"
            />
            {h.text ? (
              <Pressable
                accessibilityLabel={i18nT("Xóa tìm kiếm")}
                accessibilityRole="button"
                style={[customerType.target, extra.clear]}
                onPress={() => { searchInput.current?.clear(); h.clearText(); }}
              >
                <MaterialIcons name="cancel" size={20} color={colors.outline} />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={h.openMap} accessibilityRole="button" style={[s.row, extra.item2, customerType.target]}>
            <MaterialIcons name="map" size={23} color={colors.primary} />
            <Text style={s.link}>{i18nT("Chọn vị trí trên bản đồ")}</Text>
            <MaterialIcons
              name="chevron-right"
              size={21}
              color={colors.primary}
            />
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={s.flex}
          contentContainerStyle={s.page}
        >
          {!h.text.trim() ? (
            <GroupedList>
              {h.savedPlaces.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => void h.select(place)}
                  style={s.listItem}
                >
                  <MaterialIcons
                    name={
                      place.name === "Nhà"
                        ? "home"
                        : place.name === "Cơ quan"
                          ? "work"
                          : "star"
                    }
                    size={24}
                    color={colors.primary}
                  />
                  <View style={s.flex}>
                    <Text style={s.text}>{i18nT(place.name)}</Text>
                    <Text style={s.muted}>{place.address}</Text>
                  </View>
                </Pressable>
              ))}

              {isPickup ? (
                <Pressable
                  disabled={h.locating}
                  onPress={() => void h.useCurrentLocation()}
                  style={s.listItem}
                >
                  <View style={[s.icon, extra.item3]}>
                    {h.locating ? (
                      <ActivityIndicator />
                    ) : (
                      <MaterialIcons
                        name="my-location"
                        size={23}
                        color={colors.successStrong}
                      />
                    )}
                  </View>
                  <View style={s.flex}>
                    <Text style={[s.text, extra.item4]}>
                      {i18nT("Dùng vị trí hiện tại")}
                    </Text>
                    <Text style={s.muted}>
                      {i18nT("Xác định điểm đón bằng GPS")}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
              {h.selected ? (
                <Pressable
                  onPress={() => h.select(h.selected!)}
                  style={s.listItem}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                  <View style={s.flex}>
                    <Text style={s.label}>{i18nT("Địa điểm đã chọn")}</Text>
                    <Text style={s.text}>{h.selected.address}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              ) : null}
              {h.recentAddresses.length ? (
                <Text style={[s.label, extra.item5]}>
                  {i18nT("Địa điểm gần đây")}
                </Text>
              ) : null}
              {h.recentAddresses.map((address) => (
                <Pressable
                  key={address}
                  onPress={() => fillRecentAddress(address)}
                  style={s.listItem}
                >
                  <View style={s.icon}>
                    <MaterialIcons
                      name="history"
                      size={22}
                      color={colors.onSurfaceVariant}
                    />
                  </View>
                  <Text style={[s.text, s.flex]} numberOfLines={2}>
                    {address}
                  </Text>
                </Pressable>
              ))}
              {!h.recentAddresses.length && !h.selected ? (
                <View style={s.empty}>
                  <MaterialIcons
                    name="travel-explore"
                    size={42}
                    color={colors.outline}
                  />
                  <Text style={s.muted}>
                    {i18nT(
                      "Tìm địa chỉ hoặc chọn một vị trí trên bản đồ để tiếp tục.",
                    )}
                  </Text>
                </View>
              ) : null}
            </GroupedList>
          ) : null}
          {h.loading ? (
            <View style={s.empty}>
              <ActivityIndicator color={colors.primary} />
              <Text style={s.muted}>{i18nT("Đang tìm địa điểm…")}</Text>
            </View>
          ) : null}
          {h.text.trim().length === 1 ? (
            <Text style={[s.muted, extra.item6]}>
              {i18nT("Nhập ít nhất 2 ký tự để tìm địa điểm.")}
            </Text>
          ) : null}
          {h.error || h.locationError ? (
            <View style={[s.errorBox, extra.item7]}>
              <Text accessibilityRole="alert" style={s.error}>
                {i18nT(h.error || h.locationError)}
              </Text>
            </View>
          ) : null}
          {!h.loading && h.results.length > 0 ? (
            <GroupedList>
              {h.results.map((place) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  disabled={h.selectingId !== null}
                  onPress={() => void h.select(place)}
                  style={s.listItem}
                >
                  <View style={s.icon}>
                    <MaterialIcons
                      name="place"
                      size={23}
                      color={isPickup ? colors.successStrong : colors.error}
                    />
                  </View>
                  <View style={s.flex}>
                    <Text style={[s.text, extra.item8]}>{place.name}</Text>
                    <Text style={s.muted}>{place.address}</Text>
                    {place.secondaryAddress ? (
                      <Text style={s.muted}>
                        {i18nT("Địa chỉ trước đây:")} {place.secondaryAddress}
                      </Text>
                    ) : null}
                    {h.selectingId === place.id ? (
                      <Text style={s.link}>
                        {i18nT("Đang xác định vị trí chính xác…")}
                      </Text>
                    ) : null}
                  </View>
                  {h.selectingId === place.id ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <MaterialIcons
                      name="north-west"
                      size={19}
                      color={colors.outline}
                    />
                  )}
                </Pressable>
              ))}
            </GroupedList>
          ) : null}
          {h.limitedCoverage &&
          !h.loading &&
          !h.error &&
          h.results.length > 0 ? (
            <Text style={[s.muted, extra.item9]}>
              {i18nT(
                "Chưa thấy đúng địa chỉ? Nhập thêm số nhà, ngõ/ngách, quận hoặc chọn vị trí trên bản đồ.",
              )}
            </Text>
          ) : null}
          {h.text.trim().length >= 2 &&
          !h.loading &&
          !h.error &&
          !h.results.length ? (
            <View style={s.empty}>
              <MaterialIcons
                name="search-off"
                size={36}
                color={colors.outline}
              />
              <Text style={s.section}>{i18nT("Chưa tìm thấy địa điểm")}</Text>
              <Text style={s.muted}>
                {i18nT(
                  "Thử thêm tên đường, quận hoặc thành phố, hoặc chọn trên bản đồ.",
                )}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: { paddingBottom: 12 },
    clear: { alignItems: "center" },
    item2: { paddingVertical: 8 },
    item3: { backgroundColor: colors.successContainer },
    item4: { fontWeight: "600" },
    item5: { margin: 16, marginBottom: 4 },
    item6: { padding: 16 },
    item7: { margin: 16 },
    item8: { fontWeight: "600" },
    item9: { padding: 16 },
  });
