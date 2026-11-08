import { Button, MotionPressable, ScreenWrapper, Typography, useThemeColors } from "@datxe/ui";
import { useState } from "react";
import { Image, Modal, StyleSheet, View } from "react-native";

export function DriverPhoto({ uri, label }: { uri: string; label: string }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  const close = () => setOpen(false);
  return (
    <>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Xem ảnh · ${label}`} onPress={() => setOpen(true)}>
        <Image source={{ uri }} style={styles.thumbnail} />
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
  preview: { flex: 1, padding: 16, gap: 16 },
  full: { flex: 1, width: "100%" },
});
