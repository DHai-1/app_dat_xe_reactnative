import { ProgressBar } from "react-native-paper";
import { DriverPage } from "@/components/DriverPage";
import { DriverPhoto } from "@/components/DriverPhoto";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  HandoverHistory,
  GroupedList,
  Typography as Text,
  ThemedTextInput as TextInput,
  useThemedStyles,
} from "@datxe/ui";
import { StyleSheet, View } from "react-native";

import { RideStopCard } from "../components/RideStopCard";
import { PHOTO_ANGLES, photoAngleLabel } from "../photoAngles";
import { useVehicleInspection } from "../hooks/useVehicleInspection";

export default function VehicleInspectionScreen() {
  const themed_s = useThemedStyles(s);
  const h = useVehicleInspection();
  const required = PHOTO_ANGLES.filter(([angle]) => angle !== "DASHBOARD");
  const missing = required.filter(([angle]) => !h.photos.some((photo) => photo.angle === angle));
  const odometerValid = /^\d+$/.test(h.odometer.trim()) && Number.isSafeInteger(Number(h.odometer));
  const fuelValid = !h.fuelLevel || (/^\d+$/.test(h.fuelLevel) && Number(h.fuelLevel) <= 100);
  return (
    <DriverPage title={`Biên bản ${h.phase === "pickup" ? "nhận xe" : "trả xe"}`}
      loading={h.loading} error={h.error}>
        {h.ride ? <RideStopCard ride={h.ride} phase={h.phase} /> : null}
        {h.existing ? <Text style={themed_s.label}>Phiên bản {h.existing.revision ?? 1}</Text> : null}
        {h.existing?.correctionReason ? <Card style={themed_s.card}>
          <Text style={themed_s.title}>Khách yêu cầu điều chỉnh</Text>
          <Text style={themed_s.text}>{h.existing.correctionReason}</Text>
          {h.existing.correctionImages?.map(image => <DriverPhoto key={image.publicId} uri={image.fileUrl} label="Ảnh khách yêu cầu điều chỉnh" />)}
          <Text style={themed_s.text}>Kiểm tra lại cùng khách, cập nhật thông tin và chụp bộ ảnh mới. Phiên bản cũ được giữ để đối chiếu; khách cần xác nhận lại trước khi tiếp tục chuyến.</Text>
        </Card> : null}
        {h.existing && !h.editable ? (
          <Card style={themed_s.card}>
            <Text style={themed_s.text}>
              {h.existing.confirmedByCustomer
                ? "Khách đã xác nhận biên bản."
                : "Đã gửi biên bản, đang chờ khách xác nhận."}
            </Text>
            <Text style={themed_s.text}>
              {h.existing.odometer} km · {h.existing.notes}
            </Text>
            {h.existing.photos.map((photo) => (
              <DriverPhoto key={photo.id} uri={photo.fileUrl} label={photoAngleLabel(photo.angle)} />
            ))}
            {!h.existing.confirmedByCustomer ? (
              <Button variant="secondary" label="Kiểm tra xác nhận của khách" onPress={() => void h.refresh()} />
            ) : null}
          </Card>
        ) : h.editable ? (
          <>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>SỐ KM ĐỒNG HỒ</Text>
              <TextInput
                accessibilityLabel="Số km đồng hồ"
                draftValue={h.odometer}
                onChangeText={h.setOdometer}
                keyboardType="number-pad"
                style={themed_s.text}
                placeholder="Ví dụ 12500"
              />
              <Text style={themed_s.label}>NHIÊN LIỆU (%) · TÙY CHỌN</Text>
              <TextInput
                draftValue={h.fuelLevel}
                onChangeText={h.setFuelLevel}
                keyboardType="number-pad"
                style={themed_s.text}
                placeholder="0–100"
              />
              <TextInput
                accessibilityLabel="Ghi chú biên bản"
                draftValue={h.notes}
                onChangeText={h.setNotes}
                multiline
                maxLength={2000}
                style={themed_s.text}
                placeholder="Tình trạng xe khi bàn giao…"
              />
            </Card>
            <GroupedList title={`Ảnh bắt buộc · ${required.length - missing.length}/${required.length}`}>
              <ProgressBar progress={(required.length - missing.length) / required.length} />
              {PHOTO_ANGLES.map(([angle, label]) => {
                const photo = h.photos.find((item) => item.angle === angle);
                const uploading = h.uploading === angle;
                return (
                  <View key={angle} style={styles.photoRow}>
                    <Text style={themed_s.text}>{label}</Text>
                    {photo ? <DriverPhoto uri={photo.uri} label={label} /> : null}
                    {h.photoError?.angle === angle ? (
                      <Text accessibilityRole="alert" style={themed_s.error}>{h.photoError.message}</Text>
                    ) : null}
                    <Button variant="secondary" label={photo ? "Chụp lại" : "Chụp ảnh"}
                      accessibilityLabel={`${photo ? "Chụp lại" : "Chụp ảnh"} · ${label}`}
                      disabled={Boolean(h.uploading) || h.submit.isPending} loading={uploading}
                      loadingLabel="Đang xử lý ảnh…" onPress={() => void h.capture(angle)} />
                  </View>
                );
              })}
            </GroupedList>
            <Card style={themed_s.card}>
              {!odometerValid ? <Text style={themed_s.label}>Nhập số km đồng hồ hợp lệ.</Text> : null}
              {!fuelValid ? <Text style={themed_s.error}>Mức nhiên liệu phải từ 0 đến 100%.</Text> : null}
              {missing.length ? <Text style={themed_s.label}>Ảnh còn thiếu · {missing.map(([, label]) => label).join(", ")}</Text> : null}
              <Button
                disabled={Boolean(h.uploading) || !odometerValid || !fuelValid || missing.length > 0}
                loading={h.submit.isPending} loadingLabel="Đang gửi…"
                onPress={() => h.submit.mutate()}
                label="Gửi biên bản cho khách xác nhận"
              />
            </Card>
          </>
        ) : !h.loading ? (
          <Text style={themed_s.text}>
            Chỉ lập biên bản sau khi đã báo tới điểm đón hoặc điểm trả.
          </Text>
        ) : null}
        {h.revisions.error ? <Button label="Thử tải lại phiên bản cũ" variant="secondary" onPress={() => void h.revisions.refetch()} /> : null}
        <HandoverHistory revisions={h.revisions.data ?? []} />
        <Button label="Cần bộ phận hỗ trợ" variant="ghost" onPress={() => h.router.push({ pathname: '/support', params: h.ride ? { rideId: String(h.ride.id) } : {} } as never)} />
    </DriverPage>
  );
}

const styles = StyleSheet.create({ photoRow: { gap: 8, paddingVertical: 8 } });
