import { customerType } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  GroupedList,
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { BookingMap } from "@/components/map/BookingMap";
import { activeRideDestination, DEFAULT_MAP_CENTER } from "../bookingUtils";
import { bookingStyles as base_s } from "../components/bookingStyles";
import { RouteSummary } from "../components/RouteSummary";
import { useVehicleSelection } from "../hooks/useVehicleSelection";
export default function VehicleSelectionScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const h = useVehicleSelection();
  return (
    <MapSheetLayout
      title={i18nT("Chọn phương tiện")}
      initialSnap={0}
      snapPoints={["72%", "95%"]}
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
      footer={<Button label="Tiếp tục · Xem giá chuyến" disabled={!h.canContinue}
        onPress={h.continueBooking} icon="arrow-forward" />}
    >
      <View style={extra.details}>
        <Text style={s.label}>{i18nT("Bước 3/4 · Phương tiện của bạn")}</Text>
        <RouteSummary
          pickup={h.draft.pickup}
          dropoff={h.draft.dropoff}
          onPickup={() => h.router.push("/ride/pickup")}
          onDropoff={() => h.router.push("/ride/destination")}
        />
        <View style={s.between}>
          <View style={s.flex}>
            <Text style={s.section}>{i18nT("Tài xế sẽ lái xe nào?")}</Text>
          </View>
          <Pressable
            onPress={() => h.router.push("/add-vehicle")}
            accessibilityRole="button"
            style={customerType.target}
          >
            <Text style={s.link}>{i18nT("+ Thêm xe")}</Text>
          </Pressable>
        </View>
        {h.loading ? <ActivityIndicator color={colors.primary} /> : null}
        {h.error ? (
          <View style={s.errorBox}>
            <Text style={s.error}>{i18nT(h.error)}</Text>
            <Pressable accessibilityRole="button" style={customerType.target} onPress={h.refresh}>
              <Text style={s.link}>{i18nT("Thử lại")}</Text>
            </Pressable>
          </View>
        ) : null}
        {h.activeRide ? (
          <View style={s.errorBox}>
            <Text style={s.text}>
              {i18nT("Bạn đang có một chuyến chưa hoàn tất.")}
            </Text>
            <Pressable
              onPress={() =>
                h.router.push(activeRideDestination(h.activeRide!))
              }
            >
              <Text style={s.link}>{i18nT("Xem chuyến đang diễn ra")}</Text>
            </Pressable>
          </View>
        ) : null}
        {!h.draft.pickup || !h.draft.dropoff ? (
          <View style={s.errorBox}>
            <Text style={s.error}>
              {i18nT("Hãy chọn đủ điểm đón và điểm đến để tiếp tục.")}
            </Text>
            <Pressable
              onPress={() =>
                h.router.push(
                  h.draft.pickup ? "/ride/destination" : "/ride/pickup",
                )
              }
            >
              <Text style={s.link}>{i18nT("Chọn địa điểm")}</Text>
            </Pressable>
          </View>
        ) : null}
        {h.vehicles.length ? <GroupedList>{h.vehicles.map((vehicle) => (
          <Pressable
            key={vehicle.id}
            onPress={() => h.setSelectedId(vehicle.id)}
            style={[
              s.row,
              extra.vehicleRow,
              h.selected?.id === vehicle.id && s.selected,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: h.selected?.id === vehicle.id }}
          >
            <View style={[s.icon, extra.item3]}>
              <MaterialIcons
                name={
                  vehicle.vehicle_type === "MOTORCYCLE"
                    ? "two-wheeler"
                    : "directions-car"
                }
                size={32}
                color={colors.primary}
              />
            </View>
            <View style={s.flex}>
              <Text style={[s.text, extra.item4]}>
                {i18nT(
                  [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
                    (vehicle.vehicle_type === "MOTORCYCLE"
                      ? "Xe máy"
                      : "Ô tô"),
                )}
              </Text>
              <Text style={[s.text, extra.item5]}>
                {vehicle.plate_number || i18nT("Chưa có biển số")}
              </Text>
              <Text style={s.muted}>
                {i18nT(
                  vehicle.transmission_type === "AUTO"
                    ? "Số tự động"
                    : vehicle.transmission_type === "MANUAL"
                      ? "Số sàn"
                      : "Chưa rõ hộp số",
                )}
                {i18nT(vehicle.color ? ` · ${vehicle.color}` : "")}
              </Text>
            </View>
            <MaterialIcons
              name={
                h.selected?.id === vehicle.id
                  ? "radio-button-checked"
                  : "radio-button-unchecked"
              }
              size={23}
              color={
                h.selected?.id === vehicle.id
                  ? colors.primary
                  : colors.outline
              }
            />
          </Pressable>
        ))}</GroupedList> : null}
        {!h.loading && !h.error && !h.vehicles.length ? (
          <View style={[s.card, s.empty]}>
            <MaterialIcons name="add-road" size={42} color={colors.outline} />
            <Text style={s.section}>
              {i18nT("Bạn chưa thêm phương tiện")}
            </Text>
            <Text style={s.muted}>
              {i18nT("Thêm xe của bạn để xem giá chuyến lái hộ.")}
            </Text>
            <Pressable accessibilityRole="button" style={customerType.target} onPress={() => h.router.push("/add-vehicle")}>
              <Text style={s.link}>{i18nT("Thêm phương tiện đầu tiên")}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </MapSheetLayout>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    details: { gap: 8 },
    item3: { width: 56, height: 56 },
    item4: { fontWeight: "700" },
    item5: { letterSpacing: 1 },
    vehicleRow: { minHeight: 64, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16 },
  });
