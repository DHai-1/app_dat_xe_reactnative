import { DriverPhoto } from "@/components/DriverPhoto";
import { rideStyles } from "@/components/rideStyles";
import { Button, GroupedList, Typography as Text, useThemeColors, useThemedStyles } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { PHOTO_ANGLES } from "../photoAngles";

export const requiredHandoverAngles = PHOTO_ANGLES.filter(([angle]) => angle !== "DASHBOARD");

export function HandoverPhotoChecklist({ photos, uploading, saving, error, onCapture }: {
  photos: { angle: string; uri: string }[];
  uploading: string | null;
  saving: boolean;
  error: { angle: string; message: string } | null;
  onCapture: (angle: string) => void;
}) {
  const s = useThemedStyles(rideStyles);
  const c = useThemeColors();
  const done = requiredHandoverAngles.filter(([angle]) => photos.some((photo) => photo.angle === angle)).length;
  return (
    <GroupedList title={`Ảnh bắt buộc · ${done}/${requiredHandoverAngles.length}`}>
      <ProgressBar progress={done / requiredHandoverAngles.length} accessibilityLabel={`${done} trên ${requiredHandoverAngles.length} ảnh bắt buộc đã tải lên`} />
      {PHOTO_ANGLES.map(([angle, label]) => {
        const photo = photos.find((item) => item.angle === angle);
        const busy = uploading === angle;
        const problem = error?.angle === angle ? error.message : undefined;
        const action = problem ? "Thử chụp lại" : photo ? "Chụp lại" : "Chụp ảnh";
        return (
          <View key={angle} style={styles.row}>
            <View style={styles.main}>
              {photo ? (
                <View style={styles.thumbnail}><DriverPhoto uri={photo.uri} label={label} tile /></View>
              ) : (
                <MaterialIcons name="photo-camera" color={c.onSurfaceVariant} size={24} />
              )}
              <View style={styles.detail}>
                <Text style={s.text}>{label}</Text>
                <Text style={[s.label, photo && !problem && { color: c.successStrong }]}>
                  {busy ? "Đang xử lý…" : problem ? (photo ? "Đang giữ ảnh trước" : "Chưa tải được ảnh") : photo ? "Đã tải lên" : "Chưa có ảnh"}
                </Text>
              </View>
            </View>
            {problem ? <Text accessibilityRole="alert" style={s.error}>{problem}</Text> : null}
            <Button variant="secondary" style={styles.action} label={action} accessibilityLabel={`${action} · ${label}`}
              disabled={Boolean(uploading) || saving} loading={busy} loadingLabel="Đang xử lý…"
              onPress={() => onCapture(angle)} />
          </View>
        );
      })}
    </GroupedList>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  main: { flex: 1, minWidth: 150, flexDirection: "row", gap: 8, alignItems: "center" },
  detail: { flex: 1, gap: 2 },
  thumbnail: { width: 72 },
  action: { width: "auto", minWidth: 104 },
});
