import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel, vehicleTypeLabel, transmissionLabel } from "@/lib/displayLabels";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  ThemedTextInput as TextInput,
  useThemedStyles,
} from "@datxe/ui";
import { Image, StyleSheet, View } from "react-native";
import { useDocuments } from "../hooks/useDocuments";
export function DocumentForm({ identity = false }: { identity?: boolean }) {
  const extra = useThemedStyles(extraStyles);

  const themed_s = useThemedStyles(s);
  const h = useDocuments(identity);
  const field = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
  ) => (
    <Card style={themed_s.card}>
      <Text style={themed_s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={!h.save.isPending}
        value={value}
        onChangeText={onChangeText}
        style={themed_s.text}
        maxLength={100}
      />
    </Card>
  );
  return (
    <DriverPage
      title={identity ? "Căn cước và ảnh chân dung" : "Giấy phép lái xe"}
      loading={h.documents.isLoading || h.profile.isLoading}
      error={h.error}
      retry={() =>
        Promise.all([
          h.documents.refetch(),
          h.profile.refetch(),
          h.skills.refetch(),
        ])
      }
    >
      {field(identity ? "Số CCCD" : "Số GPLX", h.number, h.setNumber)}
      {!identity ? (
        <>
          {field("Hạng bằng", h.licenseClass, h.setLicenseClass)}
          {field("Số năm kinh nghiệm", h.years, h.setYears)}
          {field("Ngày hết hạn (YYYY-MM-DD, nếu có)", h.expiry, h.setExpiry)}
          <Card style={themed_s.card}>
            <Text style={themed_s.label}>LOẠI XE ĐĂNG KÝ</Text>
            {(["CAR", "MOTORCYCLE"] as const).map((type) => (
              <Pressable
                key={type}
                disabled={h.save.isPending}
                onPress={() => h.setVehicleType(type)}
              >
                <Text style={themed_s.text}>
                  {h.vehicleType === type ? "●" : "○"}{" "}
                  {vehicleTypeLabel(type)}
                </Text>
              </Pressable>
            ))}
            {(["AUTO", "MANUAL"] as const).map((type) => (
              <Pressable
                key={type}
                disabled={h.save.isPending}
                onPress={() => h.setTransmission(type)}
              >
                <Text style={themed_s.text}>
                  {h.transmission === type ? "●" : "○"}{" "}
                  {transmissionLabel(type)}
                </Text>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
      {h.types.map((type) => {
        const current = h.documents.data?.find((d) => d.document_type === type);
        const uri = h.images[type] ?? current?.secure_url;
        return (
          <View key={type} style={themed_s.card}>
            <Text style={themed_s.label}>{documentTypeLabel(type)}</Text>
            {uri ? <Image source={{ uri }} style={extra.item1} /> : null}
            {current ? (
              <>
                <StatusBadge kind="documentReview" value={current.verification_status} contextLabel="Xét duyệt giấy tờ" />
                {current.rejection_reason ? <Text style={themed_s.error}>Lý do: {current.rejection_reason}</Text> : null}
              </>
            ) : null}
            <Pressable
              disabled={h.save.isPending}
              onPress={() => h.choose(type)}
            >
              <Text style={themed_s.link}>{uri ? "Thay ảnh" : "Thêm ảnh"}</Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={themed_s.text}>
        Giấy tờ được gửi để xét duyệt. Kết quả xác minh sẽ hiển thị sau khi hồ
        sơ được kiểm tra.
      </Text>
      <Button
        disabled={h.save.isPending || !h.documents.data || !h.profile.data}
        onPress={() => h.save.mutate()}
        style={themed_s.button}
        label={h.save.isPending ? "Đang gửi hồ sơ…" : "Lưu và tiếp tục"}
        textStyle={themed_s.buttonText}
      />
    </DriverPage>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { height: 190, borderRadius: 12 },
  });
