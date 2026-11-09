import { useSendTicketMessage, useTicketDetail, useTicketMessages } from '@/lib/useTickets';
import { pickTicketImage } from '@/lib/supportImages';
import { uploadDriverImage } from '@/lib/uploadImage';
import { TicketChat } from '@datxe/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TicketChatScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = Number(rawId);
  const valid = Number.isSafeInteger(id) && id > 0;
  const detail = useTicketDetail(id, valid);
  const messages = useTicketMessages(id, valid);
  const send = useSendTicketMessage(id);
  const list = messages.data ?? detail.data?.messages ?? [];
  const error = !valid ? 'Thiếu mã yêu cầu hỗ trợ.' : detail.error?.message || messages.error?.message || send.error?.message;

  return (
    <TicketChat
      ticket={detail.data?.ticket ?? null}
      messages={list}
      currentRole="DRIVER"
      loading={detail.isLoading || messages.isLoading}
      sending={send.isPending}
      error={error}
      onBack={() => router.back()}
      onRefresh={() => { void detail.refetch(); void messages.refetch(); }}
      onPickImage={pickTicketImage}
      onSend={async ({ body, image }) => {
        const imageUrl = image ? (await uploadDriverImage(image, 'SUPPORT')).secureUrl : undefined;
        await send.mutateAsync({ body, imageUrl });
      }}
    />
  );
}
