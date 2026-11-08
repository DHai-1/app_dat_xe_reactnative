import { translate as t } from "@datxe/shared";
import { useState } from "react";
import { Image, Modal, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { ActivityIndicator, IconButton } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Button } from "../components/Button";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { Typography } from "../components/Typography";
import { useThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

const maxZoom = 5;
const origin = { x: 0, y: 0 };
const emptySize = { width: 0, height: 0 };

function clampOffset(offset: number, imageSize: number, viewportSize: number, scale: number) {
  "worklet";
  const limit = Math.max(0, (imageSize * scale - viewportSize) / 2);
  return Math.min(limit, Math.max(-limit, offset));
}

export function ChatImageViewer({ uri, title = "Ảnh tin nhắn", onClose }: { uri: string; title?: string; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.fill}>
        <ImageCanvas key={uri} uri={uri} title={title} onClose={onClose} />
      </GestureHandlerRootView>
    </Modal>
  );
}

function ImageCanvas({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  useLanguage();
  const colors = useThemeColors();
  const [viewport, setViewport] = useState(emptySize);
  const [image, setImage] = useState(emptySize);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fit = image.width > 0 && image.height > 0 && viewport.width > 0 && viewport.height > 0
    ? Math.min(viewport.width / image.width, viewport.height / image.height)
    : 0;
  const width = image.width * fit;
  const height = image.height * fit;
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const pinching = useSharedValue(false);
  const panStart = useSharedValue(origin);
  const pinchStart = useSharedValue({ ...origin, scale: 1, focalX: 0, focalY: 0 });

  const zoom = (next: number, focusX = 0, focusY = 0) => {
    "worklet";
    const ratio = next / scale.get();
    x.set(withTiming(clampOffset(focusX + (x.get() - focusX) * ratio, width, viewport.width, next)));
    y.set(withTiming(clampOffset(focusY + (y.get() - focusY) * ratio, height, viewport.height, next)));
    scale.set(withTiming(next));
  };

  const pinch = usePinchGesture({
    enabled: fit > 0,
    onActivate: (event) => {
      pinching.set(true);
      pinchStart.set({ x: x.get(), y: y.get(), scale: scale.get(), focalX: event.focalX, focalY: event.focalY });
    },
    onUpdate: (event) => {
      const start = pinchStart.get();
      const next = Math.max(1, Math.min(maxZoom, start.scale * event.scale));
      const ratio = next / start.scale;
      const relativeX = start.focalX - viewport.width / 2;
      const relativeY = start.focalY - viewport.height / 2;
      scale.set(next);
      x.set(clampOffset(event.focalX - start.focalX + relativeX + (start.x - relativeX) * ratio, width, viewport.width, next));
      y.set(clampOffset(event.focalY - start.focalY + relativeY + (start.y - relativeY) * ratio, height, viewport.height, next));
    },
    onFinalize: () => { pinching.set(false); },
  });
  const pan = usePanGesture({
    enabled: fit > 0,
    maxPointers: 1,
    minDistance: 5,
    onActivate: (event) => panStart.set({ x: x.get() - event.translationX, y: y.get() - event.translationY }),
    onUpdate: (event) => {
      if (pinching.get() || event.numberOfPointers !== 1) return;
      const start = panStart.get();
      x.set(clampOffset(start.x + event.translationX, width, viewport.width, scale.get()));
      y.set(clampOffset(start.y + event.translationY, height, viewport.height, scale.get()));
    },
  });
  const doubleTap = useTapGesture({
    enabled: fit > 0,
    numberOfTaps: 2,
    onActivate: (event) => zoom(scale.get() > 1 ? 1 : 2.5, event.x - viewport.width / 2, event.y - viewport.height / 2),
  });
  const gestures = useSimultaneousGestures(pinch, pan, doubleTap);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <ScreenWrapper style={{ backgroundColor: colors.mediaViewerBackground }}>
      <View style={styles.toolbar}>
        <IconButton style={styles.action} icon="close" iconColor={colors.onScrim} accessibilityLabel={t("Đóng ảnh")} onPress={onClose} />
        <Typography accessibilityRole="header" style={[styles.title, { color: colors.onScrim }]}>{t(title)}</Typography>
      </View>
      <GestureDetector gesture={gestures} touchAction="none">
        <View style={styles.canvas} onLayout={({ nativeEvent: { layout } }) => {
          setViewport({ width: layout.width, height: layout.height });
          scale.set(1);
          x.set(0);
          y.set(0);
        }}>
          {!failed && viewport.width > 0 && viewport.height > 0 ? (
            <Animated.View style={[{ width: width || viewport.width, height: height || viewport.height }, animated]}>
              <Image
                key={attempt}
                source={{ uri }}
                accessibilityLabel={t(title)}
                resizeMode="contain"
                style={styles.image}
                onLoad={(event) => {
                  const updateSize = (width: number, height: number) => {
                    if (width > 0 && height > 0) setImage({ width, height });
                    else setFailed(true);
                  };
                  const source = event.nativeEvent?.source;
                  if (source) updateSize(source.width, source.height);
                  else Image.getSize(uri, updateSize, () => setFailed(true));
                }}
                onError={() => setFailed(true)}
              />
            </Animated.View>
          ) : null}
          {!fit && !failed ? <ActivityIndicator style={styles.loading} color={colors.onScrim} accessibilityLabel={t("Đang tải ảnh")} /> : null}
          {failed ? (
            <View style={styles.failure}>
              <Typography style={{ color: colors.onScrim }}>{t("Không tải được ảnh.")}</Typography>
              <Button label="Thử tải lại" onPress={() => { setFailed(false); setAttempt((value) => value + 1); }} />
            </View>
          ) : null}
        </View>
      </GestureDetector>
      <View style={styles.controls}>
        <IconButton style={styles.action} icon="minus" iconColor={colors.onScrim} accessibilityLabel={t("Thu nhỏ")} disabled={!fit || failed} onPress={() => zoom(Math.max(1, scale.get() / 1.5))} />
        <IconButton style={styles.action} icon="fit-to-screen-outline" iconColor={colors.onScrim} accessibilityLabel={t("Vừa màn hình")} disabled={!fit || failed} onPress={() => zoom(1)} />
        <IconButton style={styles.action} icon="plus" iconColor={colors.onScrim} accessibilityLabel={t("Phóng to")} disabled={!fit || failed} onPress={() => zoom(Math.min(maxZoom, scale.get() * 1.5))} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  action: { width: 48, height: 48, borderRadius: 999 },
  toolbar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: "600" },
  canvas: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  loading: { position: "absolute" },
  failure: { alignItems: "center", gap: 12, padding: 24 },
  controls: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
});
