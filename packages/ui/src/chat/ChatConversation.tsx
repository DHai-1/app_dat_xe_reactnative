import { getLocale, translate as t } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, IconButton, TouchableRipple } from "react-native-paper";
import { Button } from "../components/Button";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { ThemedTextInput } from "../components/ThemedTextInput";
import { Typography as Text } from "../components/Typography";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";
import { ChatImageViewer } from "./ChatImageViewer";

export type ChatRow = {
  key: string;
  mine: boolean;
  createdAt: string;
  content?: string | null;
  image?: string | null;
  delivery?: "sending" | "failed" | "sent" | "read";
  error?: string;
  retry?: () => void;
};

type Props = {
  title: string;
  subtitle: string;
  avatar?: string | null;
  rows: ChatRow[];
  draft: string;
  onDraftChange: (text: string) => void;
  loading: boolean;
  busy: boolean;
  enabled: boolean;
  notice?: string;
  emptyTitle: string;
  emptyHint?: string;
  error?: string | null;
  hasMore: boolean;
  loadingOlder: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onLoadOlder: () => void;
  onSend: () => void;
  onAttach: () => void;
};

const deliveryLabels = {
  sending: "Đang gửi…",
  failed: "Gửi thất bại",
  sent: "Đã gửi",
  read: "Đã đọc",
};

export function ChatConversation({
  title, subtitle, avatar, rows, draft, onDraftChange, loading, busy, enabled,
  notice, emptyTitle, emptyHint, error, hasMore, loadingOlder,
  onBack, onRefresh, onLoadOlder, onSend, onAttach,
}: Props) {
  useLanguage();
  const s = useThemedStyles(makeStyles);
  const list = useRef<FlatList<ChatRow>>(null);
  const [nearLatest, setNearLatest] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const newestFirst = useMemo(() => [...rows].reverse(), [rows]);
  const locale = getLocale();
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);
  const timeFormat = useMemo(() => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }), [locale]);
  const sendDisabled = busy || !enabled || !draft.trim();

  const latest = () => list.current?.scrollToOffset({ offset: 0, animated: true });
  return (
    <ScreenWrapper>
      <Appbar.Header statusBarHeight={0} style={s.header}>
        <Appbar.BackAction style={s.action} accessibilityLabel={t("Quay lại")} onPress={onBack} />
        {avatar && avatar !== failedAvatar
          ? <Avatar.Image size={38} source={{ uri: avatar }} onError={() => setFailedAvatar(avatar)} />
          : <Avatar.Icon size={38} icon="account" color={s.accent.color} style={s.avatar} />}
        <View style={s.identity}>
          <Text accessibilityRole="header" numberOfLines={1} style={s.title}>{title}</Text>
          <Text numberOfLines={1} style={s.subtitle}>{subtitle}</Text>
        </View>
        <Appbar.Action style={s.action} icon="refresh" accessibilityLabel={t("Làm mới tin nhắn")} onPress={onRefresh} />
      </Appbar.Header>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {error ? (
          <View style={s.notice}>
            <Text accessibilityRole="alert" style={s.error}>{error}</Text>
            <IconButton style={s.action} icon="refresh" accessibilityLabel={t("Thử tải lại")} onPress={onRefresh} />
          </View>
        ) : null}
        {loading && !rows.length ? (
          <View style={s.empty}><ActivityIndicator accessibilityLabel={t("Đang tải trò chuyện")} /></View>
        ) : !rows.length ? (
          <View style={s.empty}>
            <Avatar.Icon size={58} icon="message-text-outline" color={s.accent.color} style={s.avatar} />
            <Text style={s.emptyTitle}>{emptyTitle}</Text>
            {emptyHint ? <Text style={s.emptyHint}>{emptyHint}</Text> : null}
          </View>
        ) : (
          <FlatList
            ref={list}
            inverted
            data={newestFirst}
            keyExtractor={(row) => row.key}
            style={s.fill}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={(event) => setNearLatest(event.nativeEvent.contentOffset.y < 100)}
            scrollEventThrottle={100}
            maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: preview ? undefined : 80 }}
            ListFooterComponent={hasMore ? (
              <Button variant="ghost" label="Tải tin nhắn cũ" loading={loadingOlder} onPress={onLoadOlder} />
            ) : undefined}
            renderItem={({ item, index }) => {
              const date = new Date(item.createdAt);
              const validDate = Number.isFinite(date.getTime());
              const day = validDate ? date.toDateString() : "";
              const older = newestFirst[index + 1];
              const startsDay = validDate && (!older || new Date(older.createdAt).toDateString() !== day);
              const followsSender = Boolean(older && !startsDay && older.mine === item.mine);
              return (
                <View style={followsSender ? s.groupedRow : s.row}>
                  {startsDay ? <Text style={s.day}>{dateFormat.format(date)}</Text> : null}
                  <View style={[s.bubble, item.mine ? s.mine : s.theirs, item.image ? s.photoBubble : undefined]}>
                    {item.image ? (
                      <ChatThumbnail uri={item.image} onPress={() => {
                        Keyboard.dismiss();
                        setPreview(item.image ?? null);
                      }} />
                    ) : null}
                    <View style={item.image ? s.caption : undefined}>
                      {item.content || !item.image ? (
                        <Text selectable style={[s.message, item.mine && s.mineText]}>{item.content || t("Tin nhắn")}</Text>
                      ) : null}
                      <View style={s.messageMeta}>
                        <Text style={[s.meta, item.mine && s.mineMeta]}>
                          {validDate ? timeFormat.format(date) : ""}
                          {item.delivery ? ` · ${t(deliveryLabels[item.delivery])}` : ""}
                        </Text>
                        {item.delivery === "sent" || item.delivery === "read" ? (
                          <MaterialIcons name={item.delivery === "read" ? "done-all" : "done"} size={14} color={item.delivery === "read" ? s.read.color : s.mineMeta.color} />
                        ) : null}
                      </View>
                      {item.retry ? (
                        <>
                          {item.error ? <Text accessibilityRole="alert" style={[s.meta, s.mineText]}>{item.error}</Text> : null}
                          <Button variant="ghost" label="Thử gửi lại" disabled={!enabled} onPress={item.retry} />
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
        {!nearLatest && rows.length ? (
          <View style={s.jump}>
            <Button variant="secondary" label="Về tin nhắn mới nhất" icon="keyboard-arrow-down" onPress={latest} />
          </View>
        ) : null}
        {!enabled && notice ? <Text style={s.closed}>{notice}</Text> : null}
        {enabled ? (
          <View style={s.composer}>
            <IconButton
              icon="image-plus" mode="contained-tonal" size={22} style={s.action}
              disabled={busy} accessibilityLabel={t("Gửi ảnh")} onPress={() => {
                Keyboard.dismiss();
                onAttach();
              }}
            />
            <ThemedTextInput
              accessibilityLabel={t("Tin nhắn")}
              placeholder={t("Nhập tin nhắn…")}
              draftValue={draft}
              onChangeText={onDraftChange}
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
              editable={!busy}
              multiline
              maxLength={1000}
              style={s.input}
            />
            {busy ? (
              <View style={s.sending}><ActivityIndicator size="small" accessibilityLabel={t("Đang xử lý…")} /></View>
            ) : (
              <IconButton
                icon="send" mode="contained" size={22} style={s.action}
                disabled={sendDisabled} accessibilityLabel={t("Gửi tin nhắn")}
                onPress={() => { onSend(); latest(); }}
              />
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {preview ? <ChatImageViewer uri={preview} onClose={() => setPreview(null)} /> : null}
    </ScreenWrapper>
  );
}

function ChatThumbnail({ uri, onPress }: { uri: string; onPress: () => void }) {
  const s = useThemedStyles(makeStyles);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <TouchableRipple accessibilityRole="button" accessibilityLabel={t("Xem ảnh tin nhắn")} onPress={onPress} style={s.thumbnail}>
      <View style={s.thumbnailFrame}>
        {failedUri === uri ? (
          <MaterialIcons name="broken-image" color={s.emptyHint.color} size={28} />
        ) : (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setFailedUri(uri)}
          />
        )}
        <View style={s.expand}>
          <MaterialIcons name="fullscreen" size={20} color={s.expandIcon.color} />
        </View>
      </View>
    </TouchableRipple>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  fill: { flex: 1 },
  header: { backgroundColor: c.cardSurface },
  avatar: { backgroundColor: c.primaryContainer },
  accent: { color: c.onPrimaryContainer },
  title: { fontSize: 18, fontWeight: "600" },
  identity: { flex: 1, minWidth: 0, marginLeft: 12 },
  subtitle: { fontSize: 12, color: c.onSurfaceVariant },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  row: { paddingTop: 10 },
  groupedRow: { paddingTop: 3 },
  day: {
    alignSelf: "center", marginVertical: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, fontSize: 12, color: c.onSurfaceVariant, backgroundColor: c.surfaceContainerHigh,
  },
  bubble: { maxWidth: "84%", borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, overflow: "hidden" },
  mine: { alignSelf: "flex-end", backgroundColor: c.primaryContainer, borderBottomRightRadius: 8 },
  theirs: { alignSelf: "flex-start", backgroundColor: c.surfaceContainerHigh, borderBottomLeftRadius: 8 },
  photoBubble: { paddingHorizontal: 4, paddingVertical: 4 },
  caption: { paddingHorizontal: 8, paddingBottom: 4 },
  message: { fontSize: 15, lineHeight: 22, color: c.onSurface },
  mineText: { color: c.onPrimaryContainer },
  messageMeta: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4 },
  meta: { flexShrink: 1, fontSize: 11, color: c.onSurfaceVariant },
  mineMeta: { color: c.onPrimaryContainer },
  read: { color: c.onPrimaryContainer },
  thumbnail: { borderRadius: 20, overflow: "hidden", backgroundColor: c.surfaceContainerHighest, width: 226, maxWidth: "100%" },
  thumbnailFrame: { aspectRatio: 4 / 3, alignItems: "center", justifyContent: "center" },
  expand: { position: "absolute", right: 8, bottom: 8, padding: 4, borderRadius: 999, backgroundColor: c.scrim70 },
  expandIcon: { color: c.onScrim },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 10 },
  emptyTitle: { textAlign: "center", fontSize: 18, fontWeight: "600" },
  emptyHint: { textAlign: "center", color: c.onSurfaceVariant },
  notice: { flexDirection: "row", alignItems: "center", paddingLeft: 16, backgroundColor: c.errorContainer },
  error: { flex: 1, color: c.onErrorContainer },
  closed: { textAlign: "center", padding: 12, fontSize: 13, color: c.onSurfaceVariant, backgroundColor: c.cardSurface },
  jump: { alignSelf: "center", marginVertical: 4 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, backgroundColor: c.cardSurface },
  action: { margin: 0, width: 48, height: 48, borderRadius: 999 },
  sending: { width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  input: {
    flex: 1, minHeight: 48, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 24, backgroundColor: c.surfaceContainerHigh,
  },
});
