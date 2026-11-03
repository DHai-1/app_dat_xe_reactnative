import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, View } from "react-native";

import {
  styles as base_styles,
  date,
  money,
} from "../components/CustomerVouchersScreenParts";
import { useCustomerVouchers } from "../hooks/useCustomerVouchers";
export default function CustomerVouchersScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, vouchers, loading, error } = useCustomerVouchers();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Ưu đãi của tôi")}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {i18nT(
            "Mã ưu đãi áp dụng được hiển thị khi hệ thống tính giá chuyến.",
          )}
        </Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.error}>{i18nT(error)}</Text> : null}
        {!loading && !error && vouchers.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons
              name="confirmation-number"
              size={38}
              color={colors.primary}
            />
            <Text style={styles.heading}>{i18nT("Chưa có ưu đãi")}</Text>
            <Text style={styles.meta}>
              {i18nT("Ưu đãi khả dụng sẽ xuất hiện tại đây.")}
            </Text>
          </View>
        ) : null}
        {vouchers.map((voucher) => (
          <View key={voucher.id} style={styles.voucher}>
            <View style={styles.voucherIcon}>
              <MaterialIcons
                name="local-offer"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.details}>
              <Text style={styles.code}>{i18nT(voucher.code)}</Text>
              <Text style={styles.discount}>
                {i18nT(
                  voucher.discountType === "PERCENT"
                    ? i18nT("Giảm {0}%{1}", {
                        "0": voucher.value,
                        "1": voucher.maxDiscount
                          ? i18nT(" tối đa {0}", {
                              "0": money(voucher.maxDiscount),
                            })
                          : "",
                      })
                    : i18nT("Giảm {0}", { "0": money(voucher.value) }),
                )}
              </Text>
              <Text style={styles.meta}>
                {i18nT("Đơn tối thiểu")}{" "}
                {i18nT(money(voucher.minimumOrderAmount))}
              </Text>
              <Text style={styles.meta}>
                {i18nT("Hiệu lực:")} {i18nT(date(voucher.validFrom))} –{" "}
                {i18nT(date(voucher.validTo))}
              </Text>
              {voucher.usageLimit !== null ? (
                <Text style={styles.meta}>
                  {i18nT("Đã dùng")} {i18nT(voucher.usageCount)}/
                  {i18nT(voucher.usageLimit)} {i18nT("lượt")}
                </Text>
              ) : null}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/ride/route-selection",
                    params: { voucherCode: voucher.code },
                  })
                }
                style={styles.use}
              >
                <Text style={styles.useText}>{i18nT("Dùng ưu đãi này")}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
