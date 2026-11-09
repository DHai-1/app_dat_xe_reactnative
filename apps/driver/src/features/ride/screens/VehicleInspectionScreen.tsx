import { useState } from "react";
import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { DriverPage } from "@/components/DriverPage";
import { DriverPhoto } from "@/components/DriverPhoto";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  HandoverHistory,
  Typography as Text,
  PaperTextInput as TextInput,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { RideStopCard } from "../components/RideStopCard";
import { HandoverSummary } from "../components/HandoverSummary";
import { HandoverPhotoChecklist, requiredHandoverAngles } from "../components/HandoverPhotoChecklist";
import { useVehicleInspection } from "../hooks/useVehicleInspection";

export default function VehicleInspectionScreen() {
  const themed_s = useThemedStyles(s);
  const h = useVehicleInspection();
  const colors = useThemeColors();
  const reviewing = h.editable ? undefined : h.existing;
  const fieldStyle = [styles.field, { backgroundColor: colors.rideInset }];
  const missing = requiredHandoverAngles.filter(([angle]) => !h.photos.some((photo) => photo.angle === angle));
  const odometerValid = /^\d+$/.test(h.odometer.trim()) && Number.isSafeInteger(Number(h.odometer));
  const fuelValid = !h.fuelLevel || (/^\d+$/.test(h.fuelLevel) && Number(h.fuelLevel) <= 100);
  const [reviewKey, setReviewKey] = useState<string | null>(null);
  const nextRevision = h.existing ? (h.existing.revision ?? 1) + 1 : 1;
  const draftKey = `${h.ride?.id}:${h.phase}:${nextRevision}`;
  const canReview = h.editable && !h.uploading && odometerValid && fuelValid && missing.length === 0;
  return (
    <DriverPage
      title={h.phase === "dropoff" ? "Biên bản trả xe" : reviewing ? "Biên bản bàn giao" : "Biên bản nhận xe"}
      appearance="ride"
      loading={h.loading}
      error={h.error}
      retry={h.ride ? undefined : h.refresh}
      footer={h.editable ? (
        <>
          <Text style={themed_s.label} accessibilityLiveRegion="polite">
            {missing.length ? `Còn thiếu ${missing.length} ảnh bắt buộc` : !odometerValid || !fuelValid ? "Kiểm tra số km và nhiên liệu" : `Sẵn sàng gửi phiên bản ${nextRevision}`}
          </Text>
          <Button label="Xem lại trước khi gửi" disabled={!canReview}
            loading={h.submit.isPending} onPress={() => setReviewKey(draftKey)} />
        </>
      ) : undefined}
    >
        {h.existing?.correctionReason ? (
          <Card style={[styles.warning, { backgroundColor: colors.warningContainer }]}>
            <View style={styles.warningHeading} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <MaterialIcons name="warning-amber" size={22} color={colors.onWarningContainer} />
              <View style={styles.warningCopy}>
                <Text style={[styles.heading, { color: colors.onWarningContainer }]}>Khách yêu cầu điều chỉnh</Text>
                <Text style={[styles.complaint, { color: colors.onWarningContainer }]}>{h.existing.correctionReason}</Text>
              </View>
            </View>
            {h.existing.correctionImages?.map((image) => (
              <DriverPhoto key={image.publicId} uri={image.fileUrl} label="Ảnh khách yêu cầu điều chỉnh" />
            ))}
            <Text style={{ color: colors.onWarningContainer }}>
              Kiểm tra lại cùng khách, cập nhật thông tin và chụp bộ ảnh mới. Phiên bản cũ được giữ để đối chiếu. Khách cần xác nhận lại trước khi tiếp tục chuyến.
            </Text>
          </Card>
        ) : null}
        {h.ride && !reviewing ? <RideStopCard ride={h.ride} phase={h.phase} /> : null}
        {h.editable ? <Text style={themed_s.label}>Bản nháp · Phiên bản {nextRevision}</Text>
          : h.existing ? <Text style={themed_s.label}>Đã gửi · Phiên bản {h.existing.revision ?? 1}</Text> : null}
        {reviewing ? (
          <HandoverSummary report={reviewing} status={h.ride?.status}>
            {!reviewing.confirmedByCustomer ? (
              <Button variant="secondary" label="Kiểm tra xác nhận của khách" onPress={() => void h.refresh()} />
            ) : null}
          </HandoverSummary>
        ) : h.editable ? (
          <>
            <Card style={[styles.form, { backgroundColor: colors.rideSurface }]}>
              <Text accessibilityRole="header" style={styles.heading}>Tình trạng xe</Text>
              <TextInput
                mode="outlined"
                label="Số km đồng hồ"
                draftValue={h.odometer}
                onChangeText={h.setOdometer}
                keyboardType="number-pad"
                style={fieldStyle}
                outlineColor={colors.outlineVariant}
                placeholder="Ví dụ 12500"
              />
              <TextInput
                mode="outlined"
                label="Nhiên liệu (%) · Tùy chọn"
                draftValue={h.fuelLevel}
                onChangeText={h.setFuelLevel}
                keyboardType="number-pad"
                style={fieldStyle}
                outlineColor={colors.outlineVariant}
                placeholder="0–100"
                error={!fuelValid}
              />
              <TextInput
                mode="outlined"
                label="Ghi chú biên bản"
                draftValue={h.notes}
                onChangeText={h.setNotes}
                multiline
                maxLength={2000}
                style={fieldStyle}
                outlineColor={colors.outlineVariant}
                placeholder="Tình trạng xe khi bàn giao…"
              />
            </Card>
            <HandoverPhotoChecklist photos={h.photos} uploading={h.uploading} saving={h.submit.isPending}
              error={h.photoError} onCapture={(angle) => void h.capture(angle)} />
            <DriverConfirmationDialog visible={reviewKey === draftKey} busy={h.submit.isPending}
              title={`Xem lại phiên bản ${nextRevision}`}
              description={`Biên bản ${h.phase === "pickup" ? "nhận xe" : "trả xe"} · ${requiredHandoverAngles.length - missing.length}/${requiredHandoverAngles.length} ảnh bắt buộc`}
              confirmLabel="Gửi cho khách xác nhận" dismissLabel="Sửa tiếp"
              destructive={false} disabled={!canReview} error={h.submit.error?.message}
              onDismiss={() => setReviewKey(null)}
              onConfirm={() => h.submit.mutate(undefined, { onSuccess: () => setReviewKey(null) })}>
              <Text>Số km đồng hồ · {h.odometer} km</Text>
              <Text>Nhiên liệu · {h.fuelLevel ? `${h.fuelLevel}%` : "Chưa ghi"}</Text>
              {h.notes.trim() ? <Text numberOfLines={4}>{h.notes}</Text> : null}
            </DriverConfirmationDialog>
          </>
        ) : !h.loading ? (
          <Text style={themed_s.text}>
            Chỉ lập biên bản sau khi đã báo tới điểm đón hoặc điểm trả.
          </Text>
        ) : null}
        {h.ride && reviewing ? <RideStopCard ride={h.ride} phase={h.phase} /> : null}
        {h.revisions.error ? <Button label="Thử tải lại phiên bản cũ" variant="secondary" onPress={() => void h.revisions.refetch()} /> : null}
        <HandoverHistory revisions={h.revisions.data ?? []} />
        <Button label="Cần bộ phận hỗ trợ" variant="ghost" onPress={() => h.router.push({ pathname: '/support', params: h.ride ? { rideId: String(h.ride.id) } : {} })} />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  warning: { padding: 20, gap: 12 },
  warningHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  warningCopy: { flex: 1, gap: 4 },
  complaint: { fontSize: 16, fontWeight: "600" },
  heading: { fontSize: 18, fontWeight: "700" },
  form: { padding: 20, gap: 12 },
  field: { minHeight: 52 },
});
