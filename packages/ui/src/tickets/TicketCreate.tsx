import { translate as t } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu } from 'react-native-paper';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MotionPressable as Pressable } from '../components/MotionPressable';
import { ThemedTextInput } from '../components/ThemedTextInput';
import { Typography as Text } from '../components/Typography';
import { useThemedStyles, type ThemeColors } from '../theme/ThemeProvider';
import { useLanguage } from '../useLanguage';

const categories = {
  TRIP: 'Chuyến đi', PAYMENT: 'Thanh toán', HANDOVER: 'Bàn giao xe', ACCOUNT: 'Tài khoản', OTHER: 'Vấn đề khác',
} as const;

type Category = keyof typeof categories;
type Draft = { category: Category; rideId: number | null; description: string };

type Props = {
  pending?: boolean;
  error?: string | null;
  onSubmit: (draft: Draft) => Promise<unknown> | void;
};

export function TicketCreate({ pending, error, onSubmit }: Props) {
  useLanguage();
  const s = useThemedStyles(makeStyles);
  const [category, setCategory] = useState<Category>('TRIP');
  const [rideId, setRideId] = useState('');
  const [description, setDescription] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setLocalError('');
    const parsedRide = rideId.trim() === '' ? null : Number(rideId);
    if (parsedRide !== null && (!Number.isSafeInteger(parsedRide) || parsedRide <= 0)) {
      setLocalError(t('Mã chuyến đi phải là số nguyên dương hoặc để trống.'));
      return;
    }
    if (description.trim().length < 10) {
      setLocalError(t('Hãy mô tả vấn đề ít nhất 10 ký tự.'));
      return;
    }
    try {
      await onSubmit({ category, rideId: parsedRide, description: description.trim() });
      setDescription('');
      setRideId('');
    } catch {
      // Lỗi được hiển thị từ mutation ở trên; giữ nội dung để người dùng thử lại.
    }
  };

  return (
    <View style={s.stack}>
      <Card style={s.card}>
        <Text style={s.label}>{t('Chủ đề')}</Text>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Pressable accessibilityRole="button" accessibilityLabel={t('Chọn chủ đề hỗ trợ')} onPress={() => setMenuOpen(true)} style={s.select}>
              <Text style={s.selectText}>{t(categories[category])}</Text>
              <MaterialIcons name="expand-more" size={22} color={s.icon.color} />
            </Pressable>
          }
        >
          {Object.entries(categories).map(([value, label]) => (
            <Menu.Item key={value} title={t(label)} onPress={() => { setCategory(value as Category); setMenuOpen(false); }} />
          ))}
        </Menu>

        <Text style={s.label}>{t('Mã chuyến đi (không bắt buộc)')}</Text>
        <ThemedTextInput
          accessibilityLabel={t('Mã chuyến đi')}
          placeholder={t('Ví dụ: 1234')}
          draftValue={rideId}
          onChangeText={setRideId}
          keyboardType="number-pad"
          maxLength={18}
          editable={!pending}
          style={s.input}
        />

        <Text style={s.label}>{t('Nội dung chi tiết')}</Text>
        <ThemedTextInput
          accessibilityLabel={t('Nội dung chi tiết')}
          placeholder={t('Mô tả vấn đề bạn gặp phải…')}
          draftValue={description}
          onChangeText={setDescription}
          multiline
          maxLength={4_000}
          editable={!pending}
          style={s.textarea}
        />
        <Text style={s.counter}>{description.length}/4000 · {t('tối thiểu 10 ký tự')}</Text>
      </Card>
      {localError || error ? <Text accessibilityRole="alert" style={s.error}>{localError || error}</Text> : null}
      <Button label={t('Gửi yêu cầu')} icon="send" iconPosition="trailing" loading={pending} disabled={pending} onPress={() => void submit()} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  stack: { gap: 16 },
  card: { padding: 16, gap: 8 },
  label: { fontWeight: '700', marginTop: 4 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.surfaceContainerHigh },
  selectText: { fontSize: 15, color: c.onSurface },
  icon: { color: c.onSurfaceVariant },
  input: { borderRadius: 14, backgroundColor: c.surfaceContainerHigh, paddingHorizontal: 14 },
  textarea: { minHeight: 120, borderRadius: 14, backgroundColor: c.surfaceContainerHigh, padding: 12, textAlignVertical: 'top' },
  counter: { color: c.onSurfaceVariant, fontSize: 12, alignSelf: 'flex-end' },
  error: { color: c.error },
});
