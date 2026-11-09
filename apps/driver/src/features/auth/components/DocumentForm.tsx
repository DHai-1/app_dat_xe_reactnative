import { DriverPage } from "@/components/DriverPage";
import { DriverPhoto } from "@/components/DriverPhoto";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel, vehicleTypeLabel, transmissionLabel } from "@/lib/displayLabels";
import { rideStyles } from "@/components/rideStyles";
import { Button, Card, CustomDatePickerModal, GroupedList, PaperTextInput as TextInput, SettingsListItem, Typography as Text, useThemeColors, useThemedStyles } from "@datxe/ui";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Dialog, HelperText, Portal, ProgressBar, RadioButton } from "react-native-paper";
import { useDocuments } from "../hooks/useDocuments";
import { documentExpiry, documentNumber } from "../onboardingValidation";

const instructions: Record<string, string> = {
  CCCD: "Chụp đủ bốn góc, thấy rõ số căn cước và ảnh trên thẻ.",
  CCCD_BACK: "Chụp toàn bộ mặt sau, tránh ánh sáng phản chiếu.",
  SELFIE: "Nhìn thẳng vào camera, để mặt rõ và đủ ánh sáng.",
  DRIVER_LICENSE: "Đặt bằng trên mặt phẳng, chụp rõ số bằng và hạng bằng.",
  DRIVER_LICENSE_BACK: "Chụp đầy đủ mặt sau của cùng giấy phép.",
};
const validationMessage = (validate: () => unknown) => {
  try { validate(); return ""; }
  catch (error) { return error instanceof Error ? error.message : "Kiểm tra lại thông tin."; }
};

export function DocumentForm({ identity = false }: { identity?: boolean }) {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const h = useDocuments(identity);
  const { document } = useLocalSearchParams<{ document?: string }>();
  const [datePicker, setDatePicker] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const busy = Boolean(h.picking) || h.save.isPending;
  const ready = Boolean(h.documents.data && h.profile.data && (identity || h.skills.data));
  const documents = h.documents.data ?? [];
  const types = [...h.types].sort((a, b) => Number(b === document) - Number(a === document));
  const photoCount = types.filter((type) => h.images[type] || documents.some((doc) => doc.document_type === type && doc.secure_url)).length;
  const numberError = validationMessage(() => documentNumber(h.number, identity));
  const dateError = identity ? "" : validationMessage(() => documentExpiry(h.expiry));
  const yearsError = !identity && (!/^\d+$/.test(h.years) || !Number.isSafeInteger(Number(h.years)));
  const licenseError = !identity && !h.licenseClass.trim();
  const expiry = h.expiry ? new Date(`${h.expiry}T00:00:00`) : null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const submit = () => {
    setAttempted(true);
    if (!numberError && !dateError && !yearsError && !licenseError && photoCount === types.length) h.save.mutate();
  };

  return (
    <DriverPage title={identity ? "Căn cước và ảnh chân dung" : "Giấy phép lái xe"}
      loading={h.documents.isLoading || h.profile.isLoading || (!identity && h.skills.isLoading)}
      error={h.error} retry={() => Promise.all([h.documents.refetch(), h.profile.refetch(), h.skills.refetch()])}>
      <Card style={s.card}>
        <Text style={s.label}>{identity ? "Bước 3/4 · Xác minh danh tính" : "Bước 2/4 · Giấy phép và kỹ năng"}</Text>
        <ProgressBar progress={identity ? 0.75 : 0.5} />
        <Text>{identity ? "Chuẩn bị căn cước hai mặt và ảnh chân dung." : "Dùng thông tin đúng như trên giấy phép lái xe."}</Text>
      </Card>
      <GroupedList title={identity ? "Thông tin căn cước" : "Thông tin giấy phép"}>
        <View style={styles.fields}>
          <TextInput label={identity ? "Số căn cước" : "Số giấy phép lái xe"} mode="flat" underlineColor={colors.transparent}
            keyboardType={identity ? "number-pad" : "default"} editable={!busy}
            value={identity ? h.number : undefined} draftValue={identity ? undefined : h.number} maxLength={identity ? 16 : 50}
            onChangeText={(number) => h.update({ number: identity ? number.replace(/\D/g, "").slice(0, 12) : number })}
            error={attempted && Boolean(numberError)} />
          {attempted && numberError ? <HelperText type="error">{numberError}</HelperText> : null}
          {!identity ? (
            <>
              <TextInput label="Hạng bằng" placeholder="Ví dụ B2, A1" mode="flat" underlineColor={colors.transparent}
                draftValue={h.licenseClass} autoCapitalize="characters" maxLength={10} editable={!busy}
                onChangeText={(licenseClass) => h.update({ licenseClass })} error={attempted && licenseError} />
              {attempted && licenseError ? <HelperText type="error">Nhập hạng bằng ghi trên giấy phép.</HelperText> : null}
              <TextInput label="Số năm kinh nghiệm" mode="flat" underlineColor={colors.transparent}
                draftValue={h.years} keyboardType="number-pad" editable={!busy}
                onChangeText={(years) => h.update({ years })} error={attempted && yearsError} />
              {attempted && yearsError ? <HelperText type="error">Nhập số năm kinh nghiệm hợp lệ.</HelperText> : null}
              <SettingsListItem title="Ngày hết hạn" description={expiry && Number.isFinite(expiry.getTime())
                ? expiry.toLocaleDateString("vi-VN") : "Để trống nếu không ghi ngày hết hạn"} icon="event"
                disabled={busy} onPress={() => setDatePicker(true)} />
              {h.expiry ? <Button variant="ghost" label="Bỏ ngày hết hạn" disabled={busy} onPress={() => h.update({ expiry: "" })} /> : null}
              {dateError ? <HelperText type="error">{dateError}</HelperText> : null}
            </>
          ) : null}
        </View>
      </GroupedList>
      {!identity ? (
        <GroupedList title="Kỹ năng lái xe">
          <RadioButton.Group value={h.vehicleType} onValueChange={(vehicleType) => {
            if (vehicleType === "CAR" || vehicleType === "MOTORCYCLE") h.update({ vehicleType });
          }}>
            {(["CAR", "MOTORCYCLE"] as const).map((type) => (
              <RadioButton.Item key={type} value={type} label={vehicleTypeLabel(type)} disabled={busy} />
            ))}
          </RadioButton.Group>
          <RadioButton.Group value={h.transmission} onValueChange={(transmission) => {
            if (transmission === "AUTO" || transmission === "MANUAL") h.update({ transmission });
          }}>
            {(["AUTO", "MANUAL"] as const).map((type) => (
              <RadioButton.Item key={type} value={type} label={transmissionLabel(type)} disabled={busy} />
            ))}
          </RadioButton.Group>
        </GroupedList>
      ) : null}
      <GroupedList title={`Ảnh giấy tờ · ${photoCount}/${types.length}`}>
        <ProgressBar progress={photoCount / types.length} accessibilityLabel={`Đã có ${photoCount} trên ${types.length} ảnh`} />
        {types.map((type) => {
          const current = documents.find((doc) => doc.document_type === type);
          const uri = h.images[type] ?? current?.secure_url;
          const label = documentTypeLabel(type);
          return (
            <View key={type} style={styles.fields}>
              <Text style={s.text}>{label}</Text>
              <Text style={s.label}>{instructions[type]}</Text>
              {uri ? <DriverPhoto uri={uri} label={label} /> : null}
              {h.images[type] ? <Text style={s.label}>Ảnh mới · Chưa gửi xét duyệt</Text>
                : current ? <StatusBadge kind="documentReview" value={current.verification_status} contextLabel="Xét duyệt giấy tờ" /> : null}
              {current?.rejection_reason ? <Text style={s.error}>{current.rejection_reason}</Text> : null}
              {h.pickError?.type === type ? <Text style={s.error} accessibilityRole="alert">{h.pickError.message}</Text> : null}
              <Button variant="secondary" icon="add-a-photo" iconPosition="leading" label={uri ? "Thay ảnh" : "Thêm ảnh"}
                accessibilityLabel={`${uri ? "Thay ảnh" : "Thêm ảnh"} · ${label}`}
                loading={h.picking === type || h.uploading === type} loadingLabel="Đang xử lý ảnh…"
                disabled={busy} onPress={() => h.setSource(type)} />
            </View>
          );
        })}
      </GroupedList>
      {attempted && photoCount < types.length ? <Text style={s.error} accessibilityRole="alert">Bổ sung đủ ảnh trước khi gửi hồ sơ.</Text> : null}
      <Button label={identity ? "Gửi hồ sơ xét duyệt" : "Lưu và tiếp tục"} disabled={!ready || busy}
        loading={h.save.isPending} loadingLabel="Đang gửi hồ sơ…" onPress={submit} />
      <Portal>
        <Dialog visible={Boolean(h.source)} onDismiss={() => h.setSource(null)}
          style={{ borderRadius: 28, backgroundColor: colors.surfaceContainerHigh }}>
          <Dialog.Title>Chọn nguồn ảnh</Dialog.Title>
          <Dialog.Content style={styles.fields}>
            <Button label="Chụp ảnh" onPress={() => { if (h.source) void h.pick(h.source, true); }} />
            <Button variant="secondary" label="Chọn từ thư viện" onPress={() => { if (h.source) void h.pick(h.source, false); }} />
            <Button variant="ghost" label="Quay lại" onPress={() => h.setSource(null)} />
          </Dialog.Content>
        </Dialog>
      </Portal>
      {!identity ? (
        <CustomDatePickerModal title="Chọn ngày hết hạn" visible={datePicker} minimumDate={tomorrow}
          value={expiry && Number.isFinite(expiry.getTime()) ? expiry : null} onCancel={() => setDatePicker(false)}
          onConfirm={(date) => {
            h.update({ expiry: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") });
            setDatePicker(false);
          }} />
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ fields: { gap: 8, paddingVertical: 8 } });
