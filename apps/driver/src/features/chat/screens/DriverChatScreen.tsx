import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, MotionPressable as Pressable, ScreenWrapper, ThemedTextInput as TextInput, Typography as Text, useThemeColors, useThemedStyles } from '@datxe/ui';
import { useSessionStore } from '@/lib/store';
import { canDriverChat } from '@/lib/chatAvailability';
import type { CustomerChatMessage } from '@datxe/shared';
import { useDriverChat } from '../hooks/useDriverChat';
import type { OutgoingMessage } from '../session';
import { chatStyles } from '../components/chatStyles';

type Row = { key: string; message?: CustomerChatMessage; pending?: OutgoingMessage };

export default function DriverChatScreen() {
  const { rideId: rawId } = useLocalSearchParams<{ rideId?: string | string[] }>();
  const rideId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const userId = useSessionStore(state => state.user?.id);
  const router = useRouter();
  if (!Number.isSafeInteger(rideId) || rideId <= 0 || !userId) return (
    <ScreenWrapper>
      <View style={{ padding: 24, gap: 16 }}>
        <Text>{userId ? 'Mã chuyến không hợp lệ.' : 'Vui lòng đăng nhập để xem cuộc trò chuyện.'}</Text>
        <Button label={userId ? 'Về trang chủ' : 'Đăng nhập'} onPress={() => router.replace(userId ? '/(tabs)/home' : '/(auth)/login')} />
      </View>
    </ScreenWrapper>
  );
  return <RideChat key={`${userId}:${rideId}`} rideId={rideId} userId={userId} />;
}

function RideChat({ rideId, userId }: { rideId: number; userId: number }) {
  const h = useDriverChat(rideId, userId);
  const s = useThemedStyles(chatStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const list = useRef<FlatList<Row>>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nearBottom, setNearBottom] = useState(true);
  const open = canDriverChat(h.ride);
  const rows: Row[] = [
    ...h.messages.map(message => ({ key: message.clientMessageId ?? `server-${message.id}`, message })),
    ...h.outgoing.map(pending => ({ key: pending.key, pending })),
  ].reverse();
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/home');
  const sendText = () => { h.sendText(); list.current?.scrollToOffset({ offset: 0 }); };
  return (
    <ScreenWrapper>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={goBack} style={s.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={s.flex}>
          <Text accessibilityRole="header" style={s.title}>Nhắn tin với khách</Text>
          <Text style={s.subtitle}>Chuyến #{rideId}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Làm mới tin nhắn" onPress={() => void h.session.refresh()} style={s.iconButton}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {h.loading ? <ActivityIndicator accessibilityLabel="Đang tải trò chuyện" color={colors.primary} /> : null}
        {h.error || h.pickerError ? (
          <View style={s.notice}>
            <Text accessibilityRole="alert" style={s.error}>{h.error || h.pickerError}</Text>
            <Button label="Thử tải lại" onPress={() => void h.session.refresh()} />
          </View>
        ) : null}
        <FlatList
          ref={list}
          inverted
          style={s.flex}
          contentContainerStyle={s.list}
          data={rows}
          keyExtractor={row => row.key}
          keyboardShouldPersistTaps="handled"
          onScroll={event => setNearBottom(event.nativeEvent.contentOffset.y < 100)}
          scrollEventThrottle={100}
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 80 }}
          ListEmptyComponent={!h.loading && !h.error ? <View style={s.empty}><Text style={s.body}>{open ? 'Bắt đầu trò chuyện với khách hàng.' : 'Chưa có tin nhắn trong chuyến này.'}</Text></View> : undefined}
          ListFooterComponent={h.hasMore ? <Button label={h.loadingOlder ? 'Đang tải…' : 'Tải tin nhắn cũ'} disabled={h.loadingOlder} onPress={() => void h.session.loadOlder()} /> : undefined}
          renderItem={({ item }) => {
            const message = item.message;
            const pending = item.pending;
            const mine = Boolean(pending || message?.senderRole === 'DRIVER');
            const uri = message?.attachmentUrl ?? pending?.body.attachmentUrl ?? pending?.file?.uri;
            const content = message?.content ?? pending?.body.content;
            const created = message?.createdAt ?? pending!.createdAt;
            return (
              <View style={[s.row, mine && s.mine]}>
                <View style={[s.bubble, mine && s.mineBubble]}>
                  {uri ? <Pressable accessibilityRole="button" accessibilityLabel="Xem ảnh tin nhắn" onPress={() => setPreview(uri)}><Image source={{ uri }} style={s.attachment} /></Pressable> : null}
                  {content ? <Text style={[s.body, mine && s.mineText]}>{content}</Text> : null}
                  <Text style={s.meta}>
                    {new Date(created).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {mine ? ` · ${pending ? pending.status === 'sending' ? 'Đang gửi…' : 'Gửi thất bại' : message?.readAt ? 'Đã đọc' : 'Đã gửi'}` : ''}
                  </Text>
                  {pending?.status === 'failed' ? <>
                    <Text accessibilityRole="alert" style={s.error}>{pending.error}</Text>
                    <Button label="Thử gửi lại" disabled={!open} onPress={() => void h.session.retry(pending.key)} />
                  </> : null}
                </View>
              </View>
            );
          }}
        />
        {!nearBottom ? <Button label="Về tin nhắn mới nhất" onPress={() => list.current?.scrollToOffset({ offset: 0, animated: true })} /> : null}
        {h.ride && !open ? <View style={s.notice}><Text style={s.subtitle}>Cuộc trò chuyện đã đóng theo trạng thái chuyến. Bạn vẫn có thể xem tin nhắn cũ.</Text></View> : null}
        <View style={s.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Gửi ảnh cho khách" disabled={!open || h.picking} onPress={() => void h.sendImage()} style={[s.iconButton, (!open || h.picking) && s.disabled]}>
            {h.picking ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="image" size={25} color={colors.primary} />}
          </Pressable>
          <TextInput accessibilityLabel="Tin nhắn cho khách" multiline maxLength={1000} editable={open && !h.picking} value={h.draft} onChangeText={h.setDraft} placeholder={open ? 'Nhập tin nhắn…' : 'Chat chưa khả dụng'} style={s.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Gửi tin nhắn" disabled={!open || !h.draft.trim() || h.picking} onPress={sendText} style={[s.iconButton, s.send, (!open || !h.draft.trim() || h.picking) && s.disabled]}>
            <MaterialIcons name="send" size={23} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={Boolean(preview)} onRequestClose={() => setPreview(null)} animationType="fade">
        <ScreenWrapper><View style={s.preview}>
          <Button label="Đóng ảnh" onPress={() => setPreview(null)} />
          {preview ? <Image source={{ uri: preview }} resizeMode="contain" style={s.previewImage} /> : null}
        </View></ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
