import { ActivityIndicator } from "react-native-paper";
import type { CustomerVoucher } from "@datxe/shared";
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

import { money, voucherUnavailable } from "../bookingUtils";
import { bookingStyles as base_s } from "./bookingStyles";
type Props = {
  visible: boolean;
  close: () => void;
  vouchers: CustomerVoucher[];
  loading: boolean;
  error?: string;
  applyError: string;
  selectedCode: string;
  applyingCode: string | null;
  subtotal?: number;
  onApply: (code: string) => void;
  onRetry: () => void;
};
export function VoucherPickerModal(p: Props) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  return (
    <Modal
      visible={p.visible}
      transparent
      animationType="slide"
      onRequestClose={p.close}
    >
      <View style={extra.item1}>
        <Pressable
          accessibilityLabel={i18nT("Đóng ưu đãi")}
          style={extra.item2}
          onPress={p.close}
        />
        <SafeAreaView edges={["bottom"]} style={[s.sheet, extra.item3]}>
          <View style={s.handle} />
          <View style={s.between}>
            <View style={s.flex}>
              <Text style={s.title}>{i18nT("Ưu đãi cho chuyến đi")}</Text>
              <Text style={s.muted}>
                {i18nT("Chọn một ưu đãi phù hợp với bạn")}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={i18nT("Đóng")}
              onPress={p.close}
              hitSlop={12}
            >
              <MaterialIcons
                name="close"
                size={25}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={extra.item4}
          >
            {p.applyError ? (
              <View style={s.errorBox}>
                <Text accessibilityRole="alert" style={s.error}>
                  {i18nT(p.applyError)}
                </Text>
              </View>
            ) : null}
            <Pressable
              disabled={p.applyingCode !== null}
              onPress={() => p.onApply("")}
              style={[s.card, s.row, !p.selectedCode && s.selected]}
            >
              <MaterialIcons
                name={
                  !p.selectedCode
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={23}
                color={colors.primary}
              />
              <Text style={[s.text, s.flex]}>{i18nT("Không dùng ưu đãi")}</Text>
              {p.applyingCode === "" ? <ActivityIndicator /> : null}
            </Pressable>
            {p.loading ? <ActivityIndicator color={colors.primary} /> : null}
            {p.error ? (
              <View style={s.errorBox}>
                <Text style={s.error}>{i18nT(p.error)}</Text>
                <Pressable onPress={p.onRetry}>
                  <Text style={s.link}>{i18nT("Tải lại ưu đãi")}</Text>
                </Pressable>
              </View>
            ) : null}
            {!p.loading && !p.error && !p.vouchers.length ? (
              <View style={s.empty}>
                <MaterialIcons
                  name="local-offer"
                  size={42}
                  color={colors.outline}
                />
                <Text style={s.section}>
                  {i18nT("Chưa có ưu đãi khả dụng")}
                </Text>
                <Text style={s.muted}>
                  {i18nT("Bạn vẫn có thể tiếp tục đặt chuyến.")}
                </Text>
              </View>
            ) : null}
            {p.vouchers.map((voucher) => {
              const reason = voucherUnavailable(voucher, p.subtotal);
              return (
                <Pressable
                  key={voucher.id}
                  disabled={Boolean(reason) || p.applyingCode !== null}
                  onPress={() => p.onApply(voucher.code)}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: p.selectedCode === voucher.code,
                    disabled: Boolean(reason),
                  }}
                  style={[
                    s.card,
                    p.selectedCode === voucher.code && s.selected,
                    reason ? extra.item5 : null,
                  ]}
                >
                  <View style={s.row}>
                    <View style={[s.icon, extra.item6]}>
                      <MaterialIcons
                        name="local-offer"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={s.flex}>
                      <Text style={s.section}>
                        {i18nT(
                          voucher.discountType === "PERCENT"
                            ? i18nT("Giảm {0}%", { "0": voucher.value })
                            : i18nT("Giảm {0}", { "0": money(voucher.value) }),
                        )}
                      </Text>
                      <Text style={s.muted}>
                        {i18nT(voucher.code)}
                        {i18nT(
                          voucher.maxDiscount !== null
                            ? i18nT(" · Tối đa {0}", {
                                "0": money(voucher.maxDiscount),
                              })
                            : "",
                        )}
                      </Text>
                    </View>
                    {p.applyingCode === voucher.code ? (
                      <ActivityIndicator />
                    ) : (
                      <MaterialIcons
                        name={
                          p.selectedCode === voucher.code
                            ? "radio-button-checked"
                            : "radio-button-unchecked"
                        }
                        size={23}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <Text style={s.muted}>
                    {i18nT("Chuyến từ")}{" "}
                    {i18nT(money(voucher.minimumOrderAmount))}{" "}
                    {i18nT("· Hết hạn")}{" "}
                    {i18nT(
                      new Date(voucher.validTo).toLocaleDateString(getLocale()),
                    )}
                  </Text>
                  {reason ? (
                    <Text style={s.error}>{i18nT(reason)}</Text>
                  ) : (
                    <Text style={s.link}>{i18nT("Chọn ưu đãi này")}</Text>
                  )}
                </Pressable>
              );
            })}
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
    item2: { flex: 1, minHeight: 48 },
    item3: { maxHeight: "85%" },
    item4: { gap: 12, paddingBottom: 12 },
    item5: { opacity: 0.5 },
    item6: { backgroundColor: colors.primarySoft },
  });
