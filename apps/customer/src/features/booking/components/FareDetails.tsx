import type { RideEstimate } from "@datxe/shared";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { minimumFareAdjustment, money } from "../bookingUtils";
import { bookingStyles as base_s } from "./bookingStyles";
function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const s = useThemedStyles(base_s);
  return (
    <View style={s.between}>
      <Text style={[s.text, s.flex, strong && extra.item1]}>
        {i18nT(label)}
      </Text>
      <Text style={[s.text, strong && extra.item2]}>{i18nT(value)}</Text>
    </View>
  );
}
export function FareDetails({
  estimate,
  loading,
  error,
  retry,
}: {
  estimate?: RideEstimate;
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const adjustment = estimate ? minimumFareAdjustment(estimate) : 0;
  return (
    <Card style={s.card}>
      <Text style={s.section}>{i18nT("Chi tiết giá")}</Text>
      {loading ? (
        <View style={s.row}>
          <ActivityIndicator color={colors.primary} />
          <Text style={s.muted}>{i18nT("Đang cập nhật giá chuyến…")}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={s.errorBox}>
          <Text accessibilityRole="alert" style={s.error}>
            {i18nT(error)}
          </Text>
          <Pressable onPress={retry}>
            <Text style={s.link}>{i18nT("Thử lấy giá lại")}</Text>
          </Pressable>
        </View>
      ) : null}
      {estimate && !error ? (
        <>
          <Text style={s.muted}>
            {i18nT(estimate.distanceKm.toFixed(1))} {i18nT("km · Khoảng")}{" "}
            {i18nT(estimate.estimatedDurationMinutes)} {i18nT("phút")}
          </Text>
          {estimate.route?.limitation ? (
            <Text style={s.muted}>{i18nT(estimate.route.limitation)}</Text>
          ) : null}
          <PriceRow
            label={i18nT("Giá mở đầu")}
            value={money(estimate.baseFare)}
          />
          <PriceRow
            label={i18nT("Cước quãng đường")}
            value={money(estimate.distanceFare)}
          />
          {estimate.waitingFare > 0 ? (
            <PriceRow
              label={i18nT("Phí chờ")}
              value={money(estimate.waitingFare)}
            />
          ) : null}
          {estimate.nightSurcharge > 0 ? (
            <PriceRow
              label={i18nT("Phụ phí ban đêm")}
              value={money(estimate.nightSurcharge)}
            />
          ) : null}
          {estimate.returnFee > 0 ? (
            <PriceRow
              label={i18nT("Phí tài xế quay về")}
              value={money(estimate.returnFee)}
            />
          ) : null}
          {adjustment > 0 ? (
            <PriceRow
              label={i18nT("Điều chỉnh cước tối thiểu")}
              value={money(adjustment)}
            />
          ) : null}
          {estimate.discountAmount > 0 ? (
            <PriceRow
              label={i18nT("Ưu đãi")}
              value={`−${money(estimate.discountAmount)}`}
            />
          ) : null}
          <View style={s.divider} />
          <PriceRow
            label={i18nT("Tổng thanh toán")}
            value={money(estimate.payableFare)}
            strong
          />
        </>
      ) : null}
      <Text style={s.muted}>
        {i18nT("Giá được tính theo lộ trình và bảng giá đang áp dụng.")}
      </Text>
    </Card>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: { fontWeight: "700" },
    item2: { fontWeight: "700", color: colors.primary },
  });
