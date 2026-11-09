import { translate as t, type CustomerImageFile, type TicketMessage, type TicketStatus, type TicketSummary } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Avatar, IconButton } from 'react-native-paper';
import { Button } from '../components/Button';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedTextInput } from '../components/ThemedTextInput';
import { Typography as Text } from '../components/Typography';
import { useThemedStyles, type ThemeColors } from '../theme/ThemeProvider';
import { useLanguage } from '../useLanguage';

const categoryLabels: Record<string, string> = {
  TRIP: 'Chuyến đi', PAYMENT: 'Thanh toán', HANDOVER: 'Bàn giao xe', ACCOUNT: 'Tài khoản', OTHER: 'Vấn đề khác',
};
const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Đã tiếp nhận', IN_PROGRESS: 'Đang xử lý', WAITING_FOR_USER: 'Chờ bạn phản hồi',
  RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

type Props = {
  ticket: TicketSummary | null;
  messages: TicketMessage[];
  currentRole: 'CUSTOMER' | 'DRIVER';
  loading?: boolean;
  sending?: boolean;
  error?: string | null;
  onBack: () => void;
  onRefresh?: () => void;
  onPickImage?: () => Promise<CustomerImageFile | null>;
  onSend: (input: { body: string; image?: CustomerImageFile | null }) => Promise<unknown> | void;
};

export function TicketChat({ ticket, messages, currentRole, loading, sending, error, onBack, onRefresh, onPickImage, onSend }: Props) {
  useLanguage();
  const s = useThemedStyles(makeStyles);
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState<CustomerImageFile | null>(null);
  const [picking, setPicking] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const list = useRef<FlatList<TicketMessage>>(null);
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const canSend = Boolean(draft.trim() || image) && !sending && !picking;
  const attach = async () => {
    if (!onPickImage || sending || picking) return;
    setPicking(true);
    try {
      const picked = await onPickImage();
      if (picked) setImage(picked);
    } catch {
      // Người dùng có thể từ chối quyền ảnh; giữ nguyên trạng thái hiện tại.
    } finally {
      setPicking(false);
    }
  };
  const submit = async () => {
    const body = draft.trim();
    const picked = image;
    if ((!body && !picked) || sending || picking) return;
    setDraft('');
    setImage(null);
    try {
      await onSend({ body, image: picked });
      list.current?.scrollToOffset({ offset: 0, animated: true });
    } catch {
      // Giữ lại nội dung/ảnh để người dùng gửi lại; lỗi hiển thị ở trên.
      setDraft(body);
      setImage(picked);
    }
  };
  return (
    <ScreenWrapper>
      <Appbar.Header statusBarHeight={0} style={s.header}>
        <Appbar.BackAction style={s.action} accessibilityLabel={t('Quay lại')} onPress={onBack} />
        <View style={s.identity}>
          <Text accessibilityRole="header" numberOfLines={1} style={s.title}>
            {ticket ? `${ticket.code} · ${categoryLabels[ticket.category] ?? ticket.category}` : t('Hỗ trợ')}
          </Text>
          <Text numberOfLines={1} style={s.subtitle}>
            {ticket ? statusLabels[ticket.status] : t('Đang tải hội thoại…')}
          </Text>
        </View>
        {onRefresh ? (
          <Appbar.Action style={s.action} icon="refresh" accessibilityLabel={t('Tải lại tin nhắn')} onPress={onRefresh} />
        ) : null}
      </Appbar.Header>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {error ? (
          <View style={s.notice}>
            <Text accessibilityRole="alert" style={s.error}>{error}</Text>
            {onRefresh ? <Button variant="secondary" label={t('Thử lại')} onPress={onRefresh} /> : null}
          </View>
        ) : null}
        {loading && !messages.length ? (
          <View style={s.empty}><ActivityIndicator accessibilityLabel={t('Đang tải hội thoại')} /></View>
        ) : !messages.length ? (
          <View style={s.empty}>
            <MaterialIcons name="support-agent" size={48} color={s.emptyIcon.color} />
            <Text style={s.emptyTitle}>{t('Chưa có tin nhắn')}</Text>
            <Text style={s.emptyHint}>{t('Gửi nội dung để bộ phận hỗ trợ tiếp nhận.')}</Text>
          </View>
        ) : (
          <FlatList
            ref={list}
            inverted
            data={newestFirst}
            keyExtractor={item => String(item.id)}
            style={s.fill}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <MessageRow message={item} mine={item.senderRole === currentRole} onImage={setPreview} />
            )}
          />
        )}
        {image ? (
          <View style={s.previewRow}>
            <Image source={{ uri: image.uri }} style={s.preview} />
            <IconButton icon="close" size={18} accessibilityLabel={t('Bỏ ảnh đã chọn')} onPress={() => setImage(null)} />
          </View>
        ) : null}
        <View style={s.composer}>
          {onPickImage ? (
            <IconButton
              icon="image-plus"
              size={22}
              style={s.action}
              disabled={sending || picking}
              accessibilityLabel={t('Đính kèm ảnh')}
              onPress={() => void attach()}
            />
          ) : null}
          <ThemedTextInput
            accessibilityLabel={t('Nhập tin nhắn')}
            placeholder={t('Nhập tin nhắn cho bộ phận hỗ trợ…')}
            draftValue={draft}
            onChangeText={setDraft}
            editable={!sending}
            multiline
            maxLength={4_000}
            style={s.input}
          />
          {sending ? (
            <ActivityIndicator style={s.sending} size="small" accessibilityLabel={t('Đang gửi')} />
          ) : (
            <IconButton
              icon="send"
              mode="contained"
              size={22}
              style={s.action}
              disabled={!canSend}
              accessibilityLabel={t('Gửi tin nhắn')}
              onPress={() => void submit()}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Đóng ảnh')} style={s.lightbox} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview }} style={s.lightboxImage} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

function MessageRow({ message, mine, onImage }: { message: TicketMessage; mine: boolean; onImage: (url: string) => void }) {
  const s = useThemedStyles(makeStyles);
  const time = new Date(message.createdAt);
  const label = Number.isFinite(time.getTime()) ? time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
  if (message.senderRole === 'SYSTEM') {
    return <Text style={s.system}>{message.body}</Text>;
  }
  return (
    <View style={[s.row, mine ? s.rowMine : s.rowTheirs]}>
      {!mine ? (
        <Avatar.Icon size={30} icon="support-agent" color={s.avatarIcon.color} style={s.avatar} />
      ) : null}
      <View style={[s.bubble, mine ? s.mine : s.theirs]}>
        {message.imageUrl ? (
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={t('Xem ảnh đính kèm')} onPress={() => onImage(message.imageUrl!)}>
            <Image source={{ uri: message.imageUrl }} style={s.image} resizeMode="cover" />
          </Pressable>
        ) : null}
        {message.body.trim() ? <Text selectable style={[s.message, mine && s.mineText]}>{message.body}</Text> : null}
        <Text style={[s.meta, mine && s.mineMeta]}>{label}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  fill: { flex: 1 },
  header: { backgroundColor: c.surface },
  action: { margin: 0 },
  identity: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  subtitle: { color: c.onSurfaceVariant, fontSize: 12 },
  list: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2, maxWidth: '100%' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatar: { backgroundColor: c.primaryContainer },
  avatarIcon: { color: c.onPrimaryContainer },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 3 },
  mine: { backgroundColor: c.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: c.surfaceContainerHigh, borderBottomLeftRadius: 4 },
  message: { color: c.onSurface, fontSize: 15, lineHeight: 21 },
  mineText: { color: c.onPrimary },
  meta: { color: c.onSurfaceVariant, fontSize: 10, alignSelf: 'flex-end' },
  mineMeta: { color: c.onPrimary, opacity: 0.8 },
  system: { alignSelf: 'center', color: c.onSurfaceVariant, fontSize: 12, paddingVertical: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyIcon: { color: c.onSurfaceVariant },
  emptyTitle: { fontWeight: '700', fontSize: 16 },
  emptyHint: { color: c.onSurfaceVariant, textAlign: 'center' },
  notice: { padding: 12, gap: 8 },
  error: { color: c.error },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 8, backgroundColor: c.surface },
  input: { flex: 1, maxHeight: 120, paddingVertical: 8, borderRadius: 20, backgroundColor: c.surfaceContainerHigh },
  sending: { margin: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  preview: { width: 56, height: 56, borderRadius: 10 },
  image: { width: 210, height: 160, borderRadius: 12, marginBottom: 2 },
  lightbox: { flex: 1, backgroundColor: c.mediaViewerBackground, alignItems: 'center', justifyContent: 'center', padding: 16 },
  lightboxImage: { width: '100%', height: '90%' },
});
