import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";

import {
  Metric,
  styles as base_styles,
} from "../components/VehicleInspectionScreenParts";
import { useVehicleInspection } from "../hooks/useVehicleInspection";
export default function VehicleInspectionScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { router, phase, ride, loading, saving, error, report, confirm } =
    useVehicleInspection();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Biên bản bàn giao")}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {i18nT(
            phase === "PICKUP"
              ? "Kiểm tra hiện trạng trước khi bắt đầu chuyến."
              : "Kiểm tra hiện trạng khi tài xế hoàn trả xe.",
          )}
        </Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {ride ? (
          <Card style={styles.card}>
            <Text style={styles.section}>
              {i18nT("Chuyến #")} {i18nT(ride.id)} ·{" "}
              {i18nT(
                phase === "PICKUP"
                  ? "Bàn giao lúc đón"
                  : "Hoàn trả tại điểm đến",
              )}
            </Text>
            <Text style={styles.meta}>
              {i18nT("Trạng thái:")} {i18nT(ride.status)}
            </Text>
            {report ? (
              <>
                <View style={styles.metrics}>
                  <Metric
                    label="Odometer"
                    value={`${report.odometer.toLocaleString(getLocale())} km`}
                  />
                  {report.fuelLevel !== null ? (
                    <Metric
                      label={i18nT("Nhiên liệu")}
                      value={`${report.fuelLevel}%`}
                    />
                  ) : null}
                </View>
                {report.notes ? (
                  <Text style={styles.body}>{report.notes}</Text>
                ) : null}
                <Text style={styles.label}>
                  {i18nT("Ảnh do tài xế gửi (")} {i18nT(report.photos.length)})
                </Text>
                {report.photos.length ? (
                  <View style={styles.images}>
                    {report.photos.map((photo) => (
                      <View key={photo.id} style={styles.imageCard}>
                        <Image
                          source={{ uri: photo.fileUrl }}
                          style={styles.image}
                        />
                        <Text style={styles.imageLabel}>
                          {i18nT(photo.angle)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.meta}>
                    {i18nT("Biên bản không có ảnh.")}
                  </Text>
                )}
                {report.confirmedByCustomer ? (
                  <View style={styles.confirmed}>
                    <MaterialIcons
                      name="verified"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.confirmedText}>
                      {i18nT("Bạn đã xác nhận biên bản này.")}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.error}>
                {i18nT("Tài xế chưa gửi biên bản")}{" "}
                {i18nT(phase === "PICKUP" ? "nhận xe" : "trả xe")}.
              </Text>
            )}
          </Card>
        ) : null}
        {error ? <Text style={styles.error}>{i18nT(error)}</Text> : null}
        {report && !report.confirmedByCustomer ? (
          <Pressable
            disabled={saving}
            onPress={() => void confirm()}
            style={[styles.primary, saving && styles.disabled]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>
                {i18nT("Xác nhận tình trạng xe")}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
