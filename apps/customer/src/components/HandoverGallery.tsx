import { translate as t, type CustomerRideDetail } from "@datxe/shared";
import { ChatImageViewer, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { customerType } from "./CustomerRideUI";

type Photo = CustomerRideDetail["handoverReports"][number]["photos"][number];
const angles = ["FRONT", "BACK", "LEFT", "RIGHT", "DASHBOARD"];
const labels: Record<string, string> = { FRONT: "Đầu xe", BACK: "Đuôi xe", LEFT: "Bên trái", RIGHT: "Bên phải", DASHBOARD: "Đồng hồ" };
const angleLabel = (angle: string) => labels[angle] ?? "Ảnh bàn giao";

export function HandoverGallery({ photos }: { photos: readonly Photo[] }) {
  useLanguage();
  const c = useThemeColors();
  const [preview, setPreview] = useState<Photo | null>(null);
  if (!photos.length) return <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>{t("Biên bản không có ảnh.")}</Text>;
  const rank = (angle: string) => {
    const index = angles.indexOf(angle);
    return index < 0 ? angles.length : index;
  };
  return (
    <>
      <View style={styles.grid}>
        {[...photos].sort((a, b) => rank(a.angle) - rank(b.angle)).map((photo) => (
          <TouchableRipple key={photo.id} accessibilityRole="button" accessibilityLabel={t(angleLabel(photo.angle))}
            onPress={() => setPreview(photo)} style={[styles.tile, { backgroundColor: c.surfaceContainerHigh }]}>
            <View style={styles.frame}>
              <Image source={{ uri: photo.fileUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={[styles.caption, { backgroundColor: c.scrim70 }]}>
                <Text style={[customerType.meta, styles.label, { color: c.onScrim }]}>{t(angleLabel(photo.angle))}</Text>
                <MaterialIcons name="fullscreen" color={c.onScrim} size={18} />
              </View>
            </View>
          </TouchableRipple>
        ))}
      </View>
      {preview ? <ChatImageViewer uri={preview.fileUrl} title={angleLabel(preview.angle)} onClose={() => setPreview(null)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "4%", rowGap: 8 },
  tile: { width: "48%", borderRadius: 12, overflow: "hidden", minWidth: 48 },
  frame: { aspectRatio: 4 / 3, minHeight: 48, justifyContent: "flex-end" },
  caption: { flexDirection: "row", justifyContent: "space-between", gap: 4, padding: 6, alignItems: "center" },
  label: { flexShrink: 1 },
});
