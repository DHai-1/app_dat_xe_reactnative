import { ScreenHeader } from '@/components/ScreenHeader';
import { getLocale } from '@datxe/shared';
import type { CustomerChatMessage } from '@datxe/shared';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDriverChatMessages, markDriverChatRead, sendDriverChatMessage, uploadDriverChatImage } from '@/features/chat/api';

function makeUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export default function DriverChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastId = useRef<number | undefined>(undefined);
  const canChat = Number.isSafeInteger(rideId) && rideId > 0;
  const refresh = async () => {
    if (!canChat) return;
    try {
      const page = await getDriverChatMessages(rideId, lastId.current ? { afterId: lastId.current, size: 100 } : { size: 50 });
      if (!page) return;
      if (page.messages.length) {
        setMessages(previous => [...new Map([...previous, ...page.messages].map(message => [message.id, message])).values()].sort((a, b) => a.id - b.id));
        lastId.current = page.messages[page.messages.length - 1].id;
        const incoming = [...page.messages].reverse().find(message => message.senderRole === 'CUSTOMER');
        if (incoming) void markDriverChatRead(rideId, incoming.id).catch(() => {});
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được tin nhắn.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 5000); return () => clearInterval(timer); }, [rideId]);
  const send = async () => {
    const content = draft.trim();
    if (!content || sending || !canChat) return;
    setSending(true);
    try {
      const message = await sendDriverChatMessage(rideId, { clientMessageId: makeUuid(), messageType: 'TEXT', content });
      if (!message) return;
      setMessages(previous => [...previous, message]);
      lastId.current = message.id;
      setDraft('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không gửi được tin nhắn.'); }
    finally { setSending(false); }
  };
  const sendImage = async () => {
    if (sending || !canChat) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    const file = result.assets?.[0];
    if (result.canceled || !file) return;
    setSending(true);
    try {
      const uploaded = await uploadDriverChatImage(rideId, { uri: file.uri, fileName: file.fileName, mimeType: file.mimeType });
      const message = await sendDriverChatMessage(rideId, { clientMessageId: makeUuid(), messageType: 'IMAGE', content: draft.trim() || null, attachmentUrl: uploaded.secureUrl, attachmentPublicId: uploaded.publicId });
      if (!message) return;
      setMessages(previous => [...previous, message]);
      lastId.current = message.id;
      setDraft('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không gửi được ảnh.'); }
    finally { setSending(false); }
  };
  const title = useMemo(() => `Nhắn tin khách hàng · Chuyến #${rideId || ''}`, [rideId]);
  return <SafeAreaView style={styles.safe}><ScreenHeader title={title} onBack={() => router.back()} />
    {loading ? <ActivityIndicator style={styles.loading} /> : <FlatList data={messages} keyExtractor={message => String(message.id)} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={[styles.bubble, item.senderRole === 'DRIVER' ? styles.mine : styles.theirs]}>{item.attachmentUrl ? <Image source={{ uri: item.attachmentUrl }} style={styles.attachment} resizeMode="cover" /> : null}{item.content ? <Text style={styles.message}>{item.content}</Text> : null}{!item.content && !item.attachmentUrl ? <Text style={styles.message}>Tin nhắn</Text> : null}<Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}</Text></View>} />}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.composer}><Pressable onPress={() => void sendImage()} style={styles.imageButton} disabled={sending}><MaterialIcons name="image" size={22} color="#FF4657" /></Pressable><TextInput value={draft} onChangeText={setDraft} placeholder="Nhập tin nhắn…" style={styles.input} editable={!sending} /><Pressable onPress={() => void send()} style={styles.send}><Text style={styles.sendText}>Gửi</Text></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFFFF' }, loading: { marginTop: 24 }, list: { padding: 16, gap: 10, flexGrow: 1, justifyContent: 'flex-end' }, bubble: { maxWidth: '82%', padding: 11, borderRadius: 14 }, mine: { alignSelf: 'flex-end', backgroundColor: '#FF4657' }, theirs: { alignSelf: 'flex-start', backgroundColor: '#F2F4F7' }, message: { color: '#101828', fontSize: 15 }, attachment: { width: 210, height: 180, borderRadius: 10 }, time: { marginTop: 4, color: '#667085', fontSize: 10 }, composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#EAECF0' }, imageButton: { minWidth: 48, minHeight: 44, borderRadius: 22, backgroundColor: '#FFE4E7', alignItems: 'center', justifyContent: 'center' }, imageButtonText: { color: '#FF4657', fontWeight: '700' }, input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 22, paddingHorizontal: 16 }, send: { minWidth: 58, borderRadius: 22, backgroundColor: '#FF4657', alignItems: 'center', justifyContent: 'center' }, sendText: { color: '#FFFFFF', fontWeight: '700' }, error: { color: '#D92D20', textAlign: 'center', padding: 8 } });
