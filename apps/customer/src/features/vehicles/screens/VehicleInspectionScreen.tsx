import { ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  Card,
  Button,
  EvidenceEditor,
  HandoverHistory,
  ThemedTextInput as TextInput,
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

  const h = useVehicleInspection();
  const { router, phase, ride, loading, saving, error, report, confirm } = h;
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
                <Text style={styles.section}>Phiên bản {report.revision ?? 1}</Text>
                {report.correctionReason ? <View style={styles.metrics}><Text style={styles.body}>Đang chờ tài xế điều chỉnh: {report.correctionReason}</Text><Text style={styles.meta}>Tài xế cần gửi phiên bản mới. Bạn sẽ kiểm tra lại trước khi xác nhận.</Text></View> : null}
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
        {h.canReview ? (
          <Pressable
            disabled={saving || h.correction.isPending || h.uploading}
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
        {h.canReview ? <Button label="Thông tin không đúng · Yêu cầu điều chỉnh" variant="secondary" disabled={saving || h.correction.isPending} onPress={() => h.setCorrectionOpen(!h.correctionOpen)} /> : null}
        {h.correctionOpen && h.canReview ? <Card style={styles.card}>
          <Text style={styles.section}>Yêu cầu sửa biên bản phiên bản {report?.revision ?? 1}</Text>
          <TextInput accessibilityLabel="Lý do yêu cầu điều chỉnh" placeholder="Thông tin nào chưa đúng? Ít nhất 10 ký tự" value={h.reason} onChangeText={h.setReason} multiline maxLength={2000} editable={!h.correction.isPending} />
          <EvidenceEditor images={h.images} onChange={h.setImages} pick={h.pickSupportImage} disabled={h.correction.isPending} onBusyChange={h.setUploading} />
          {h.correction.error ? <Text style={styles.error}>{h.correction.error.message}</Text> : null}
          <Button label={h.correction.isPending ? 'Đang gửi…' : 'Gửi yêu cầu điều chỉnh'} disabled={saving || h.uploading || h.correction.isPending} onPress={() => h.correction.mutate()} />
        </Card> : null}
        {h.revisions.error ? <Button label="Chưa tải được phiên bản cũ · Thử lại" variant="secondary" onPress={() => void h.revisions.refetch()} /> : null}
        <HandoverHistory revisions={h.revisions.data ?? []} />
        {ride ? <Button label="Cần bộ phận hỗ trợ" variant="ghost" onPress={() => router.push({ pathname: '/support', params: { rideId: String(ride.id) } })} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
