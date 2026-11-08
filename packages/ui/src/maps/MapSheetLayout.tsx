import BottomSheet, {
  BottomSheetScrollView, BottomSheetView, KEYBOARD_STATUS, useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { translate as t } from '@datxe/shared';
import { Button } from '../components/Button';
import { Typography as Text } from '../components/Typography';
import { useThemeColors } from '../theme/ThemeProvider';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapViewportInsets } from './types';

type Props = {
  title?: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  topActions?: ReactNode;
  footer: ReactNode;
  renderMap: (viewport: MapViewportInsets) => ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  initialSnap?: 0 | 1;
  insetBottom?: boolean;
  snapPoints?: [`${number}%`, `${number}%`];
};

const HANDLE_HEIGHT = 48;

function SheetBody({ children, footer, contentStyle, bottomInset, backgroundColor, onFooterHeight, hideDetails }: {
  children: ReactNode;
  footer: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  bottomInset: number;
  backgroundColor: string;
  onFooterHeight: (height: number) => void;
  hideDetails: boolean;
}) {
  const { animatedLayoutState, animatedPosition, animatedKeyboardState } = useBottomSheetInternal();
  const visibleBody = useAnimatedStyle(() => {
    const { containerHeight, handleHeight } = animatedLayoutState.get();
    if (containerHeight <= 0 || handleHeight < 0) return { height: 0 };
    const keyboard = animatedKeyboardState.get();
    const keyboardInset = keyboard.status === KEYBOARD_STATUS.SHOWN ? keyboard.heightWithinContainer : 0;
    // Gorhom lays out content against the highest snap point. Bound this column to the
    // visible snap height so its flex footer stays above the screen edge and keyboard.
    return { height: Math.max(0, containerHeight - animatedPosition.get() - handleHeight - keyboardInset) };
  });

  return (
    <Animated.View style={visibleBody}>
      {/* Register the layout wrapper before the scroll view registers itself. */}
      <BottomSheetView focusHook={useLayoutEffect} style={styles.sheetBody}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scrollViewport}
          contentContainerStyle={[styles.content, contentStyle]}
          importantForAccessibility={hideDetails ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={hideDetails}
        >
          {children}
        </BottomSheetScrollView>
        <View
          onLayout={event => onFooterHeight(Math.ceil(event.nativeEvent.layout.height))}
          style={[styles.footer, { backgroundColor, paddingBottom: 8 + bottomInset }]}
        >
          {footer}
        </View>
      </BottomSheetView>
    </Animated.View>
  );
}

export function MapSheetLayout({
  title, onBack, backAccessibilityLabel = 'Quay lại', topActions, footer, renderMap,
  children, contentStyle, initialSnap = 1, insetBottom = true, snapPoints: configuredSnapPoints,
}: Props) {
  const colors = useThemeColors();
  const safe = useSafeAreaInsets();
  const ref = useRef<BottomSheet>(null);
  const [height, setHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(76);
  const [index, setIndex] = useState<number>(initialSnap);
  const topInset = safe.top + 68;
  const bottomInset = insetBottom ? safe.bottom : 0;
  const expanded = Math.max(3, height - topInset);
  const collapsed = Math.min(expanded - 2, HANDLE_HEIGHT + footerHeight);
  const middle = Math.min(expanded - 1, Math.max(collapsed + 1, Math.round(height * 0.52)));
  const snapPoints = configuredSnapPoints ?? [collapsed, middle, expanded];
  const cameraSnap = snapPoints[Math.max(0, Math.min(index, configuredSnapPoints ? initialSnap : 1))];
  const sheetOcclusion = typeof cameraSnap === 'string' ? expanded * parseFloat(cameraSnap) / 100 : cameraSnap;
  const viewport = {
    top: topInset,
    bottom: height > 0 && index >= 0
      ? Math.min(sheetOcclusion, Math.max(0, height - topInset - 96))
      : bottomInset,
  };
  const renderHandle = useCallback(() => (
    <View style={styles.handleRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(index === 0 ? 'Mở thông tin bản đồ' : 'Thu gọn thông tin bản đồ')}
        onPress={() => ref.current?.snapToIndex(index === 0 ? 1 : 0)}
        style={styles.handleTarget}
      >
        <View style={[styles.handle, { backgroundColor: colors.onSurfaceVariant }]} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Ẩn thông tin bản đồ')}
        onPress={() => ref.current?.close()}
        style={styles.hideTarget}
      >
        <MaterialIcons name="fullscreen" size={22} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  ), [colors.onSurfaceVariant, index]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}
      onLayout={event => setHeight(Math.round(event.nativeEvent.layout.height))}
    >
      <View style={StyleSheet.absoluteFill}>
        {renderMap(viewport)}
      </View>
      {safe.top > 0 ? (
        <View pointerEvents="none" style={[styles.statusBarSurface, { height: safe.top, backgroundColor: colors.background }]} />
      ) : null}
      <View pointerEvents="box-none" style={[styles.topBar, { top: safe.top + 8 }]}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t(backAccessibilityLabel)} onPress={onBack}
            style={[styles.back, { backgroundColor: colors.surfaceContainerLow }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
        ) : null}
        {title ? (
          <Text accessibilityRole="header" numberOfLines={2}
            style={[styles.title, { color: colors.onSurface, backgroundColor: colors.surfaceContainerLow }]}
          >{title}</Text>
        ) : <View pointerEvents="none" style={styles.spacer} />}
        {topActions}
      </View>
      {height > topInset + 3 ? (
        <BottomSheet
          ref={ref}
          index={initialSnap}
          snapPoints={snapPoints}
          topInset={topInset}
          enableDynamicSizing={false}
          enableContentPanningGesture={!configuredSnapPoints}
          enablePanDownToClose
          enableBlurKeyboardOnGesture
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          onChange={setIndex}
          onClose={() => setIndex(-1)}
          handleComponent={renderHandle}
          backgroundStyle={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <SheetBody footer={footer} contentStyle={contentStyle} bottomInset={bottomInset}
            backgroundColor={colors.surfaceContainerLowest} onFooterHeight={setFooterHeight}
            hideDetails={index < 0 || (index === 0 && !configuredSnapPoints)}>
            {children}
          </SheetBody>
        </BottomSheet>
      ) : null}
      {index < 0 ? (
        <View pointerEvents="box-none" style={[styles.reopen, { bottom: bottomInset + 12 }]}>
          <Button variant="secondary" icon="expand-less" iconPosition="leading"
            label="Mở thông tin bản đồ" onPress={() => ref.current?.snapToIndex(initialSnap)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusBarSurface: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    position: 'absolute', left: 12, right: 12, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  title: {
    flexShrink: 1, marginRight: 'auto', borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 16, lineHeight: 21, fontWeight: '600',
  },
  spacer: { flex: 1 },
  back: { width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleRow: { height: HANDLE_HEIGHT },
  handleTarget: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hideTarget: {
    position: 'absolute', right: 8, width: 48, height: HANDLE_HEIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  handle: { width: 36, height: 4, borderRadius: 999, opacity: 0.58 },
  sheetBody: { flex: 1, bottom: 0 },
  scrollViewport: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 16 },
  footer: { flexShrink: 0, paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  reopen: { position: 'absolute', right: 12, zIndex: 2 },
});
