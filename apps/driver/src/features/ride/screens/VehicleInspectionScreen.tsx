import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useThemedStyles,
} from "@datxe/ui";
import { ActivityIndicator, Image, ScrollView, StyleSheet } from "react-native";

import { PickupNoteCard } from "../components/PickupNoteCard";
import {
  PHOTO_ANGLES,
  useVehicleInspection,
} from "../hooks/useVehicleInspection";
export default function VehicleInspectionScreen() {
  const extra = useThemedStyles(extraStyles);

  const themed_s = useThemedStyles(s);

  const h = useVehicleInspection();
  return (
    <SafeAreaView style={themed_s.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={themed_s.page}
      >
        <Pressable onPress={() => h.router.back()}>
          <Text style={themed_s.link}>‹ Quay lại</Text>
        </Pressable>
        <Text style={themed_s.title}>
          Biên bản {h.phase === "pickup" ? "nhận xe" : "trả xe"}
        </Text>
        <PickupNoteCard />
        {h.loading ? <ActivityIndicator /> : null}
        {h.error ? <Text style={themed_s.error}>{h.error}</Text> : null}
        {h.existing ? (
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
              <Image
                key={photo.id}
                source={{ uri: photo.fileUrl }}
                style={extra.item1}
              />
            ))}
          </Card>
        ) : h.editable ? (
          <>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>SỐ KM ĐỒNG HỒ</Text>
              <TextInput
                accessibilityLabel="Số km đồng hồ"
                value={h.odometer}
                onChangeText={h.setOdometer}
                keyboardType="number-pad"
                style={themed_s.text}
                placeholder="Ví dụ 12500"
              />
              <Text style={themed_s.label}>NHIÊN LIỆU (%) · TÙY CHỌN</Text>
              <TextInput
                value={h.fuelLevel}
                onChangeText={h.setFuelLevel}
                keyboardType="number-pad"
                style={themed_s.text}
                placeholder="0–100"
              />
              <TextInput
                accessibilityLabel="Ghi chú biên bản"
                value={h.notes}
                onChangeText={h.setNotes}
                multiline
                maxLength={2000}
                style={themed_s.text}
                placeholder="Tình trạng xe khi bàn giao…"
              />
            </Card>
            {PHOTO_ANGLES.map(([angle, label]) => (
              <Pressable
                key={angle}
                disabled={Boolean(h.uploading) || h.submit.isPending}
                onPress={() => void h.capture(angle)}
                style={themed_s.card}
              >
                <Text style={themed_s.link}>{label} · Chụp ảnh</Text>
                {h.uploading === angle ? <ActivityIndicator /> : null}
                {h.photos.find((photo) => photo.angle === angle) ? (
                  <Image
                    source={{
                      uri: h.photos.find((photo) => photo.angle === angle)!.uri,
                    }}
                    style={extra.item2}
                  />
                ) : null}
              </Pressable>
            ))}
            <Button
              disabled={Boolean(h.uploading) || h.submit.isPending}
              onPress={() => h.submit.mutate()}
              style={themed_s.button}
              label={
                h.submit.isPending
                  ? "Đang gửi…"
                  : "Gửi biên bản cho khách xác nhận"
              }
              textStyle={themed_s.buttonText}
            />
          </>
        ) : (
          <Text style={themed_s.text}>
            Chỉ lập biên bản sau khi đã báo tới điểm đón hoặc điểm trả.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { height: 180, borderRadius: 12 },
    item2: { height: 180, borderRadius: 12 },
  });
