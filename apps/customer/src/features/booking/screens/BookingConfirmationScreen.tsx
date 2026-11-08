import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { List } from "react-native-paper";
import { customerType, MoneyText } from "@/components/CustomerRideUI";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  Button,
  Card,
  type ThemeColors,
  MotionPressable as Pressable,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import { BookingMap } from "@/components/map/BookingMap";
import { activeRideDestination, DEFAULT_MAP_CENTER } from "../bookingUtils";
import { bookingStyles as base_s } from "../components/bookingStyles";
import { FareDetails } from "../components/FareDetails";
import { RouteSummary } from "../components/RouteSummary";
import { SchedulePickerModal } from "../components/SchedulePickerModal";
import { VoucherPickerModal } from "../components/VoucherPickerModal";
import { useBookingConfirmation } from "../hooks/useBookingConfirmation";
// The sheet uses Gesture Handler's native TextInput. Its adapter forwards the
// same editor used by the uncontrolled draft component, with an optional ref value.
const SheetDraftInput = BottomSheetTextInput as unknown as NonNullable<ComponentProps<typeof TextInput>["inputComponent"]>;

export default function BookingConfirmationScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const h = useBookingConfirmation();
  return (
    <>
      <MapSheetLayout
        title={i18nT("Xác nhận chuyến đi")}
        initialSnap={0}
        snapPoints={["68%", "95%"]}
        onBack={() => h.router.back()}
        renderMap={viewport => (
          <BookingMap
            center={h.draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER}
            pickup={h.draft.pickup}
            dropoff={h.draft.dropoff}
            route={h.route}
            viewport={viewport}
          />
        )}
        footer={(
          <View style={extra.summary}>
            <View style={extra.summaryRow}>
              <Text style={s.muted}>{i18nT("Tổng thanh toán")}</Text>
              {h.estimating ? (
                <Text style={s.muted}>{i18nT("Đang cập nhật giá chuyến…")}</Text>
              ) : h.estimate && !h.error ? (
                <MoneyText value={h.estimate.payableFare} style={extra.summaryAmount} />
              ) : (
                <Text style={s.muted}>{i18nT("Chưa có giá")}</Text>
              )}
            </View>
            <Button
              label={h.scheduledAt ? "Xác nhận đặt lịch" : "Đặt chuyến lái hộ"}
              disabled={!h.ready}
              loading={h.submitting}
              onPress={h.book}
              icon="arrow-forward"
            />
          </View>
        )}
      >
        <View style={extra.details}>
          <View style={s.between}>
            <Text style={s.label}>
              {i18nT("Bước 4/4 · Kiểm tra chuyến đi")}
            </Text>
            <Pressable accessibilityRole="button" onPress={h.openSchedule} style={[s.row, s.chip]}>
              <MaterialIcons
                name={h.scheduledAt ? "event" : "schedule"}
                size={17}
                color={colors.primary}
              />
              <Text style={s.link}>
                {i18nT(h.scheduledAt ? "Đặt lịch" : "Đi ngay")}
              </Text>
              <MaterialIcons
                name="expand-more"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>
          {h.scheduledAt ? (
            <Text style={s.text}>
              {i18nT("Đón lúc")}{" "}
              {i18nT(new Date(h.scheduledAt).toLocaleString(getLocale()))}
            </Text>
          ) : null}
          <RouteSummary
            pickup={h.draft.pickup}
            dropoff={h.draft.dropoff}
            onPickup={() =>
              h.router.push({
                pathname: "/ride/pickup",
                params: { edit: "1" },
              })
            }
            onDropoff={() =>
              h.router.push({
                pathname: "/ride/destination",
                params: { edit: "1" },
              })
            }
          />
          <Pressable accessibilityRole="button" style={customerType.target}
            onPress={() => h.router.push({ pathname: "/ride/map-picker", params: { kind: "pickup", edit: "1" } })}>
            <Text style={s.link}>{i18nT("Chỉnh ghim điểm đón trên bản đồ")}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              h.router.push({
                pathname: "/ride/vehicle",
                params: { edit: "1" },
              })
            }
            style={[s.card, s.row]}
          >
            <View style={s.icon}>
              <MaterialIcons
                name={
                  h.vehicle?.vehicle_type === "MOTORCYCLE"
                    ? "two-wheeler"
                    : "directions-car"
                }
                size={26}
                color={colors.primary}
              />
            </View>
            <View style={s.flex}>
              <Text style={s.label}>{i18nT("Phương tiện của bạn")}</Text>
              <Text style={[s.text, extra.item4]}>
                {h.vehicle
                  ? `${[h.vehicle.brand, h.vehicle.model].filter(Boolean).join(" ") || i18nT("Xe")} · ${h.vehicle.plate_number ?? ""}`
                  : i18nT("Chọn phương tiện")}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
          <Card style={s.card}>
            <View style={s.row}>
              <MaterialIcons
                name="payments"
                size={24}
                color={colors.successStrong}
              />
              <View style={s.flex}>
                <Text style={s.text}>{i18nT("Tiền mặt")}</Text>
                <Text style={s.muted}>
                  {i18nT("Thanh toán cho tài xế khi kết thúc chuyến")}
                </Text>
              </View>
              <MaterialIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={s.divider} />
            <Pressable
              accessibilityLabel={i18nT("Chọn ưu đãi cho chuyến đi")}
              onPress={() => h.setVoucherVisible(true)}
              style={[s.row, customerType.target]}
            >
              <MaterialIcons
                name="local-offer"
                size={24}
                color={colors.primary}
              />
              <View style={s.flex}>
                <Text style={[s.text, extra.item5]}>
                  {i18nT(
                    h.draft.voucherCode
                      ? (h.selectedVoucher?.code ?? h.draft.voucherCode)
                      : "Chọn ưu đãi",
                  )}
                </Text>
                <Text style={s.muted}>
                  {i18nT(
                    h.draft.voucherCode
                      ? "Nhấn để đổi hoặc bỏ ưu đãi"
                      : "Xem ưu đãi dành cho chuyến đi này",
                  )}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </Card>
          {h.activeRide ? (
            <View style={s.errorBox}>
              <Text style={s.error}>
                {i18nT("Bạn đang có một chuyến chưa hoàn tất.")}
              </Text>
              <Pressable
                onPress={() =>
                  h.router.replace(activeRideDestination(h.activeRide!))
                }
              >
                <Text style={s.link}>
                  {i18nT("Theo dõi chuyến hiện tại")}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <FareDetails
            estimate={h.estimate}
            loading={h.estimating}
            error={h.error}
            retry={() => void h.retryPrice()}
          />
          {h.error && h.draft.voucherCode ? (
            <Pressable onPress={() => h.draft.setVoucher("")}>
              <Text style={s.link}>{i18nT("Bỏ ưu đãi và tính lại giá")}</Text>
            </Pressable>
          ) : null}
          <Card style={s.card}>
            <List.Accordion title={i18nT("Ghi chú cho tài xế")} style={extra.noteToggle}
              description={h.draft.pickupNote || h.note ? i18nT("Đã thêm ghi chú") : undefined}
              theme={{ colors: { background: colors.transparent } }}>
              <View style={extra.notes}>
                <Text style={s.section}>{i18nT("Ghi chú điểm đón")}</Text>
                <TextInput
                  inputComponent={SheetDraftInput}
                  accessibilityLabel={i18nT("Ghi chú điểm đón")}
                  draftValue={h.draft.pickupNote}
                  onChangeText={h.draft.setPickupNote}
                  maxLength={500}
                  multiline
                  placeholder={i18nT(
                    "Ví dụ: chờ ở đầu ngõ 165, cổng số 2, sảnh A…",
                  )}
                  style={[s.text, extra.item3]}
                />
                <Text style={s.section}>{i18nT("Ghi chú cho tài xế")}</Text>
                <TextInput
                  inputComponent={SheetDraftInput}
                  accessibilityLabel={i18nT("Ghi chú cho tài xế")}
                  draftValue={h.note}
                  onChangeText={h.setNote}
                  maxLength={500}
                  multiline
                  placeholder={i18nT("Ví dụ: đón ở cổng chính, xe đỗ tầng B1…")}
                  style={[s.text, extra.item6]}
                />
                <Text style={[s.muted, extra.item7]}>
                  {i18nT(h.note.length)}/500
                </Text>
              </View>
            </List.Accordion>
          </Card>
        </View>
      </MapSheetLayout>
      <VoucherPickerModal
        visible={h.voucherVisible}
        close={() => h.setVoucherVisible(false)}
        vouchers={h.vouchers}
        loading={h.vouchersLoading}
        error={h.vouchersError}
        applyError={h.voucherError}
        selectedCode={h.draft.voucherCode}
        applyingCode={h.applyingCode}
        subtotal={h.estimate?.estimatedFare}
        onApply={(code) => void h.applyVoucher(code)}
        onRetry={() => void h.retryVouchers()}
      />
      <SchedulePickerModal
        visible={h.scheduleVisible}
        close={() => h.setScheduleVisible(false)}
        selected={h.scheduledAt}
        slots={h.slots}
        onSelect={(slot) => {
          h.setScheduledAt(slot);
          h.setScheduleVisible(false);
        }}
      />
    </>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    noteToggle: { minHeight: 48 },
    notes: { gap: 12 },
    details: { gap: 16 },
    summary: { gap: 8 },
    summaryRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
    summaryAmount: { fontSize: 28, lineHeight: 34, fontWeight: "700", marginLeft: "auto", textAlign: "right" },
    item3: { minHeight: 72, textAlignVertical: "top", padding: 12, borderRadius: 16, backgroundColor: colors.inputSurface },
    item4: { fontWeight: "700" },
    item5: { fontWeight: "600" },
    item6: { minHeight: 72, textAlignVertical: "top", padding: 12, borderRadius: 16, backgroundColor: colors.inputSurface },
    item7: { alignSelf: "flex-end" },

  });
