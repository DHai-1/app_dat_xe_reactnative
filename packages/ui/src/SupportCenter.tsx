import type { SupportDraft, SupportImage, SupportRide, SupportTicket } from '@datxe/shared';
import { useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Typography as Text } from './components/Typography';
import { ThemedTextInput as TextInput } from './components/ThemedTextInput';
import { useThemedStyles, type ThemeColors } from './theme/ThemeProvider';
import { ScreenWrapper } from './components/ScreenWrapper';

const categories = { TRIP: 'Sự cố chuyến đi', PAYMENT: 'Thanh toán', HANDOVER: 'Bàn giao xe', ACCOUNT: 'Tài khoản', OTHER: 'Vấn đề khác' };
const statuses = { OPEN: 'Đã tiếp nhận', IN_PROGRESS: 'Đang xử lý', RESOLVED: 'Đã trả lời' };
const requestId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => { const n = Math.floor(Math.random() * 16); return (char === 'x' ? n : (n & 3) | 8).toString(16); });

export function EvidenceEditor({ images, onChange, pick, disabled = false, onBusyChange }: {
  images: SupportImage[]; onChange: (images: SupportImage[]) => void; pick: () => Promise<SupportImage | null>; disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const s = useThemedStyles(styles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const add = async () => {
    if (lock.current || disabled || images.length >= 5) return;
    lock.current = true; setBusy(true); onBusyChange?.(true); setError('');
    try { const image = await pick(); if (image) onChange([...images, image]); }
    catch (e) { setError(e instanceof Error ? e.message : 'Chưa tải được ảnh. Hãy thử lại.'); }
    finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
  };
  return <View style={s.stack}>
    {images.map((image, index) => <View key={image.publicId} style={s.stack}>
      <Image source={{ uri: image.fileUrl }} style={s.image} accessibilityLabel={`Ảnh đính kèm ${index + 1}`} />
      <Button label={`Bỏ ảnh ${index + 1}`} variant="ghost" disabled={disabled || busy} onPress={() => onChange(images.filter(item => item.publicId !== image.publicId))} />
    </View>)}
    <Button label={busy ? 'Đang tải ảnh…' : `Thêm ảnh (${images.length}/5)`} variant="secondary" disabled={disabled || busy || images.length >= 5} onPress={() => void add()} />
    {busy ? <Text>Chờ ảnh tải xong trước khi gửi yêu cầu.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}

export function SupportCenter({ rides, tickets, send, pickImage, loadMoreRides, loadMoreTickets, initialRideId, pending, loading, error: loadError }: {
  rides: SupportRide[]; tickets: SupportTicket[]; send: (draft: SupportDraft) => Promise<SupportTicket>;
  pickImage: () => Promise<SupportImage | null>; loadMoreRides?: () => void; loadMoreTickets?: () => void;
  initialRideId?: number; pending: boolean;
  loading?: boolean; error?: string | null;
}) {
  const s = useThemedStyles(styles);
  const [rideId, setRideId] = useState<number | null>(initialRideId || null);
  const [chooseRide, setChooseRide] = useState(false);
  const [category, setCategory] = useState('TRIP');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<SupportImage[]>([]);
  const [receipt, setReceipt] = useState<SupportTicket | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sendLock = useRef(false);
  const submission = useRef<{ body: string; id: string } | null>(null);
  const submit = async () => {
    if (sendLock.current || sending || pending || uploading) return;
    if (description.trim().length < 10) { setError('Hãy mô tả vấn đề ít nhất 10 ký tự.'); return; }
    const body = { rideId, category, description: description.trim(), images };
    const serialized = JSON.stringify(body);
    if (submission.current?.body !== serialized) submission.current = { body: serialized, id: requestId() };
    sendLock.current = true; setSending(true); setError('');
    try { setReceipt(await send({ ...body, clientRequestId: submission.current.id })); setDescription(''); setImages([]); submission.current = null; }
    catch (e) { setError(e instanceof Error ? e.message : 'Gửi chưa thành công. Bạn có thể thử lại.'); }
    finally { sendLock.current = false; setSending(false); }
  };
  return <View style={s.stack}>
    <Card style={s.stack}>
      <Text accessibilityRole="header" style={s.title}>Gửi yêu cầu cho bộ phận hỗ trợ</Text>
      <Text>Yêu cầu được lưu và có mã tiếp nhận. Xem phản hồi trong mục Yêu cầu của bạn bên dưới.</Text>
      <Text>Kênh này không xử lý khẩn cấp và chưa cam kết thời gian phản hồi.</Text>
    </Card>
    {receipt ? <Card style={s.stack}><Text style={s.title}>Đã tiếp nhận · {receipt.code}</Text><Text>Giữ mã này để tra cứu. Bộ phận hỗ trợ sẽ xem xét nội dung bạn gửi.</Text></Card> : null}
    <Card style={s.stack}>
      <Text style={s.title}>Chuyến liên quan</Text>
      <Button label={rideId ? `Chuyến #${rideId} · Đổi chuyến` : 'Chọn chuyến liên quan · Tùy chọn'} variant="secondary" disabled={sending} onPress={() => setChooseRide(true)} />
      <Text style={s.title}>Bạn cần hỗ trợ về</Text>
      {Object.entries(categories).map(([value, label]) => <Button key={value} label={`${category === value ? '✓ ' : ''}${label}`} variant={category === value ? 'primary' : 'secondary'} disabled={sending} onPress={() => setCategory(value)} />)}
      <TextInput accessibilityLabel="Mô tả sự cố" placeholder="Điều gì đã xảy ra? Bạn cần hỗ trợ như thế nào?" value={description} editable={!sending} onChangeText={setDescription} multiline maxLength={4000} style={s.input} />
      <Text>{description.length}/4000 ký tự · Tối thiểu 10 ký tự</Text>
      <EvidenceEditor images={images} onChange={setImages} pick={pickImage} disabled={sending} onBusyChange={setUploading} />
      {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
      <Button label={sending ? 'Đang gửi…' : 'Gửi yêu cầu hỗ trợ'} disabled={sending || pending || uploading} onPress={() => void submit()} />
    </Card>
    <Text accessibilityRole="header" style={s.title}>Yêu cầu của bạn</Text>
    {!tickets.length && !loading && !loadError ? <Text>Chưa có yêu cầu hỗ trợ.</Text> : null}
    {tickets.map(ticket => <Card key={ticket.id} style={s.stack}>
      <Text style={s.title}>{ticket.code} · {statuses[ticket.status]}</Text>
      <Text>{categories[ticket.category as keyof typeof categories] ?? 'Hỗ trợ'}{ticket.rideId ? ` · Chuyến #${ticket.rideId}` : ''}</Text>
      <Text>{new Date(ticket.createdAt).toLocaleString('vi-VN')}</Text>
      <Text>{ticket.description}</Text>
      {ticket.images.map(image => <Image key={image.publicId} source={{ uri: image.fileUrl }} style={s.image} accessibilityLabel="Ảnh yêu cầu hỗ trợ" />)}
      {ticket.response ? <><Text style={s.title}>Phản hồi từ bộ phận hỗ trợ</Text><Text>{ticket.response}</Text></> : <Text>Chưa có phản hồi. Bạn có thể tải lại để kiểm tra.</Text>}
    </Card>)}
    {loadMoreTickets ? <Button label="Xem thêm yêu cầu" variant="secondary" onPress={loadMoreTickets} /> : null}
    <Modal visible={chooseRide} animationType="slide" onRequestClose={() => setChooseRide(false)}>
      <ScreenWrapper><ScrollView contentContainerStyle={s.modal}>
        <Text accessibilityRole="header" style={s.title}>Chọn chuyến cần hỗ trợ</Text>
        <Button label="Đóng danh sách chuyến" variant="ghost" onPress={() => setChooseRide(false)} />
        <Button label="Không gắn chuyến" variant="secondary" onPress={() => { setRideId(null); setChooseRide(false); }} />
        {rides.map(ride => <Button key={ride.id} label={`${rideId === ride.id ? '✓ ' : ''}#${ride.id} · ${ride.pickupAddress ?? 'Điểm đón'} → ${ride.dropoffAddress ?? 'Điểm đến'}`} variant={rideId === ride.id ? 'primary' : 'secondary'} onPress={() => { setRideId(ride.id); setChooseRide(false); }} />)}
        {loadMoreRides ? <Button label="Xem thêm chuyến" variant="ghost" onPress={loadMoreRides} /> : null}
      </ScrollView></ScreenWrapper>
    </Modal>
  </View>;
}
const styles = (c: ThemeColors) => StyleSheet.create({
  stack: { gap: 12 }, title: { fontSize: 18, fontWeight: '700', color: c.onSurface },
  input: { minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: c.outline, borderRadius: 12, padding: 12 },
  image: { width: '100%', height: 180, borderRadius: 12 }, error: { color: c.error },
  modal: { padding: 20, gap: 12 },
});
