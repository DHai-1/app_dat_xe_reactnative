import { Button, MotionPressable, ScreenWrapper, Typography, useThemeColors } from "@datxe/ui";
import { useState } from "react";
import { Image, Modal, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function DriverPhoto({ uri, label, tile = false }: { uri: string; label: string; tile?: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const close = () => setOpen(false);
  return (
    <>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Xem ảnh · ${label}`} onPress={() => setOpen(true)}
        style={tile ? [styles.tile, { backgroundColor: colors.rideInset }] : undefined}>
        <Image source={{ uri }} style={tile ? styles.tileImage : styles.thumbnail} />
        {tile ? (
          <LinearGradient colors={[colors.transparent, colors.photoCaptionScrim]} style={styles.caption}>
            <Typography style={[styles.captionText, { color: colors.onScrim }]}>{label}</Typography>
          </LinearGradient>
        ) : null}
      </MotionPressable>
      <Modal visible={open} animationType="fade" onRequestClose={close}>
        <ScreenWrapper>
          <View style={[styles.preview, { backgroundColor: colors.background }]}>
            <Typography accessibilityRole="header">{label}</Typography>
            {open ? <Image accessibilityLabel={label} source={{ uri }} resizeMode="contain" style={styles.full} /> : null}
            <Button variant="secondary" label="Đóng ảnh" onPress={close} />
          </View>
        </ScreenWrapper>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: { width: "100%", height: 176, borderRadius: 16 },
  tile: { aspectRatio: 4 / 3, borderRadius: 12, overflow: "hidden" },
  tileImage: { width: "100%", height: "100%" },
  caption: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, paddingTop: 24 },
  captionText: { fontSize: 12, fontWeight: "700" },
  preview: { flex: 1, padding: 16, gap: 16 },
  full: { flex: 1, width: "100%" },
});
