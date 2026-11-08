import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { HeaderIconButton, ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  GroupedList,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, ScrollView, View } from "react-native";

import { styles as base_styles } from "../components/CustomerVehiclesScreenParts";
import { useCustomerVehicles } from "../hooks/useCustomerVehicles";
export default function CustomerVehiclesScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, vehicles, loading, error, deletingId, remove, refresh } =
    useCustomerVehicles();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Xe của tôi")}
        onBack={() => router.back()}
        rightContent={
          <HeaderIconButton
            icon="add"
            accessibilityLabel={i18nT("Thêm xe")}
            onPress={() => router.push("/add-vehicle")}
            tone="primary"
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
        {!loading && !error && vehicles.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons
              name="directions-car"
              size={38}
              color={colors.primary}
            />
            <Text style={styles.heading}>{i18nT("Chưa có phương tiện")}</Text>
            <Text style={styles.meta}>
              {i18nT("Thêm xe để chọn khi tạo chuyến đi.")}
            </Text>
          </View>
        ) : null}
        {vehicles.length ? (
          <GroupedList>
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicle}>
                {vehicle.images[0]?.secure_url ? (
                  <Image
                    source={{ uri: vehicle.images[0].secure_url }}
                    style={styles.image}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons
                      name="directions-car"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/add-vehicle",
                      params: { vehicleId: String(vehicle.id) },
                    })
                  }
                  style={styles.details}
                >
                  <Text style={styles.name}>
                    {i18nT(
                      [vehicle.brand, vehicle.model]
                        .filter(Boolean)
                        .join(" ") ||
                        (vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "Phương tiện"),
                    )}
                  </Text>
                  <Text style={styles.plate}>
                    {vehicle.plate_number || i18nT("Chưa có biển số")}
                  </Text>
                  <Text style={styles.meta}>
                    {i18nT(vehicle.vehicle_type === "MOTORCYCLE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "—")} ·{" "}
                    {i18nT(vehicle.transmission_type === "AUTO" ? "Số tự động" : vehicle.transmission_type === "MANUAL" ? "Số sàn" : "—")}
                    {i18nT(vehicle.color ? ` · ${vehicle.color}` : "")}
                    {i18nT(
                      vehicle.engine_cc ? ` · ${vehicle.engine_cc} cc` : "",
                    )}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={i18nT("Xóa {0}", {
                    "0": vehicle.plate_number || i18nT("xe"),
                  })}
                  disabled={deletingId === vehicle.id}
                  onPress={() => remove(vehicle)}
                  style={styles.delete}
                >
                  {deletingId === vehicle.id ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <MaterialIcons
                      name="delete-outline"
                      size={23}
                      color={colors.error}
                    />
                  )}
                </Pressable>
              </View>
            ))}
          </GroupedList>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/add-vehicle")}
          style={styles.add}
        >
          <MaterialIcons name="add" size={20} color={colors.onPrimary} />
          <Text style={styles.addText}>{i18nT("Thêm xe mới")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
