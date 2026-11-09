import { useCreateTicket } from '@/lib/useTickets';
import { ScreenWrapper, TicketCreate } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Snackbar } from 'react-native-paper';

export default function CreateTicketScreen() {
  const router = useRouter();
  const create = useCreateTicket();
  const [toast, setToast] = useState(false);

  return (
    <ScreenWrapper>
      <Appbar.Header statusBarHeight={0}>
        <Appbar.BackAction accessibilityLabel="Quay lại" onPress={() => router.back()} />
        <Appbar.Content title="Tạo yêu cầu hỗ trợ" />
      </Appbar.Header>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <TicketCreate pending={create.isPending} error={create.error?.message} onSubmit={draft => create.mutateAsync(draft, { onSuccess: () => { setToast(true); setTimeout(() => router.back(), 900); } })} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={toast} onDismiss={() => setToast(false)} duration={800}>Đã gửi yêu cầu hỗ trợ</Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
});
