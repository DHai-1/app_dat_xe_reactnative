import { translate as i18nT } from '@datxe/shared';
import type { CustomerChatMessage,CustomerRideDetail } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useCallback,useRef,useState } from 'react';
import { getCustomerChatMessages,getCustomerRide,markCustomerChatRead,sendCustomerChatMessage,uploadCustomerChatImage } from '../api';
import { canChat,makeUuid } from '../components/CustomerChatScreenParts';
export function useCustomerChat() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const [ride, setRide] = useState<CustomerRideDetail | null>(null);
const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
const [draft, setDraft] = useState('');
const [loading, setLoading] = useState(true);
const [loadingOlder, setLoadingOlder] = useState(false);
const [sending, setSending] = useState(false);
const [hasMore, setHasMore] = useState(false);
const [error, setError] = useState('');
const messageList = useRef<CustomerChatMessage[]>([]);
const initialized = useRef(false);
const assignment = useRef<string | null>(null);
const requestInFlight = useRef(false);
const applyMessages = (next: CustomerChatMessage[]) => {
    messageList.current = next;
    setMessages(next);
  };
const refresh = useCallback(async (initial = false) => {
    if (!rideId) {
      setError(i18nT("Thiếu mã chuyến để mở cuộc trò chuyện."));
      setLoading(false);
      return;
    }
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const currentRide = await getCustomerRide(rideId);
      setRide(currentRide);
      const thread = `${rideId}:${currentRide.driverId ?? ""}`;
      if (assignment.current !== thread) {
        if (assignment.current !== null) setDraft("");
        assignment.current = thread;
        initialized.current = false;
        applyMessages([]);
        setHasMore(false);
      }
      const lastId = messageList.current.at(-1)?.id;
      if (initial || !initialized.current) {
        const page = await getCustomerChatMessages(rideId, { size: 30 });
        const ordered = [...page.messages].reverse();
        applyMessages(ordered);
        setHasMore(page.hasMore);
        initialized.current = true;
        const latestIncoming = [...ordered].reverse().find((message) => message.senderRole === 'DRIVER');
        if (latestIncoming) void markCustomerChatRead(rideId, latestIncoming.id).catch(() => {});
      } else {
        const page = await getCustomerChatMessages(rideId, lastId ? { afterId: lastId, size: 100 } : { size: 30 });
        if (page.messages.length) {
          const merged = new Map(messageList.current.map((message) => [message.id, message]));
          page.messages.forEach((message) => merged.set(message.id, message));
          const ordered = [...merged.values()].sort((a, b) => a.id - b.id);
          applyMessages(ordered);
          setHasMore((current) => current || page.hasMore);
          const latestIncoming = [...page.messages].reverse().find((message) => message.senderRole === 'DRIVER');
          if (latestIncoming) void markCustomerChatRead(rideId, latestIncoming.id).catch(() => {});
        }
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : i18nT("Không tải được cuộc trò chuyện."));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [rideId]);
useQuery({queryKey:['customer','chatPoll',rideId],queryFn:async()=>{await refresh(!initialized.current);return true;},enabled:rideId>0,refetchInterval:5000});
const loadOlder = async () => {
    const oldestId = messageList.current[0]?.id;
    if (!oldestId || !hasMore || loadingOlder) return;
    const thread = assignment.current;
    setLoadingOlder(true);
    try {
      const page = await getCustomerChatMessages(rideId, { beforeId: oldestId, size: 30 });
      if (thread !== assignment.current) return;
      const older = [...page.messages].reverse();
      const merged = new Map([...older, ...messageList.current].map((message) => [message.id, message]));
      applyMessages([...merged.values()].sort((a, b) => a.id - b.id));
      setHasMore(page.hasMore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : i18nT("Không tải được tin nhắn cũ."));
    } finally {
      setLoadingOlder(false);
    }
  };
const sendText = async () => {
    const content = draft.trim();
    if (!content || sending || !canChat(ride)) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendCustomerChatMessage(rideId, { clientMessageId: makeUuid(), messageType: 'TEXT', content });
      const merged = new Map(messageList.current.map((message) => [message.id, message]));
      merged.set(sent.id, sent);
      applyMessages([...merged.values()].sort((a, b) => a.id - b.id));
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : i18nT("Không gửi được tin nhắn."));
    } finally {
      setSending(false);
    }
  };
const sendImage = async () => {
    if (sending || !canChat(ride)) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      const file = result.assets?.[0];
      if (result.canceled || !file) return;
      setSending(true);
      setError('');
      const uploaded = await uploadCustomerChatImage(rideId, { uri: file.uri, fileName: file.fileName, mimeType: file.mimeType });
      const sent = await sendCustomerChatMessage(rideId, {
        clientMessageId: makeUuid(),
        messageType: 'IMAGE',
        content: draft.trim() || null,
        attachmentUrl: uploaded.secureUrl,
        attachmentPublicId: uploaded.publicId,
      });
      const merged = new Map(messageList.current.map((message) => [message.id, message]));
      merged.set(sent.id, sent);
      applyMessages([...merged.values()].sort((a, b) => a.id - b.id));
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : i18nT("Không gửi được ảnh."));
    } finally {
      setSending(false);
    }
  };
const chatEnabled = canChat(ride);
return { router, rideId, ride, messages, draft, setDraft, loading, loadingOlder, sending, hasMore, error, refresh, loadOlder, sendText, sendImage, chatEnabled };
}
