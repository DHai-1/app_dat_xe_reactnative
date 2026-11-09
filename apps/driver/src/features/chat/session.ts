import type { CustomerChatMessage, CustomerChatPage, CustomerChatPageOptions, CustomerChatSendRequest, CustomerImageFile, CustomerRideDetail } from '@datxe/shared';
import { canDriverChat } from '@/lib/chatAvailability';

export type OutgoingMessage = {
  key: string;
  body: CustomerChatSendRequest;
  file?: CustomerImageFile;
  createdAt: string;
  status: 'sending' | 'failed';
  error?: string;
};
type State = {
  ride: CustomerRideDetail | null;
  messages: CustomerChatMessage[];
  outgoing: OutgoingMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  error: string;
};
type Dependencies = {
  ride: () => Promise<CustomerRideDetail>;
  messages: (options: CustomerChatPageOptions) => Promise<CustomerChatPage>;
  send: (body: CustomerChatSendRequest) => Promise<CustomerChatMessage>;
  upload: (file: CustomerImageFile) => Promise<{ secureUrl: string; publicId: string }>;
  read: (id: number) => Promise<void>;
  onRead: () => void;
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Không kết nối được. Vui lòng thử lại.';
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
  const value = Math.floor(Math.random() * 16);
  return (char === 'x' ? value : (value & 3) | 8).toString(16);
});

// One instance per account/ride. Pending messages retain their UUID and uploaded asset on retry.
export function createChatSession(api: Dependencies) {
  let state: State = { ride: null, messages: [], outgoing: [], loading: true, loadingOlder: false, hasMore: false, error: '' };
  const listeners = new Set<() => void>();
  let refreshing = false;
  let initialized = false;
  let newestFetched = 0;
  let visible = false;
  let readThrough = 0;
  let reading = false;
  const patch = (next: Partial<State>) => {
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
  };
  const merge = (messages: CustomerChatMessage[]) => {
    const byId = new Map(state.messages.map(message => [message.id, message]));
    messages.forEach(message => {
      const previous = byId.get(message.id);
      // An older in-flight poll must not undo a newer CHAT_READ receipt.
      byId.set(message.id, { ...message, readAt: message.readAt ?? previous?.readAt ?? null });
    });
    const merged = [...byId.values()].sort((a, b) => a.id - b.id);
    const acknowledged = new Set(merged.map(message => message.clientMessageId));
    patch({ messages: merged, outgoing: state.outgoing.filter(message => !acknowledged.has(message.key)) });
  };
  const markRead = async () => {
    if (!visible || reading) return;
    const latest = state.messages.filter(message => message.senderRole === 'CUSTOMER').at(-1)?.id ?? 0;
    if (latest <= readThrough) return;
    reading = true;
    try {
      await api.read(latest);
      readThrough = latest;
      api.onRead();
    } catch { /* Retried on the next focused refresh; never clear unread optimistically. */ }
    finally { reading = false; }
  };
  const refresh = async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      const ride = await api.ride();
      patch({ ride });
      if (!initialized) {
        const page = await api.messages({ size: 30 });
        merge(page.messages);
        newestFetched = Math.max(0, ...page.messages.map(message => message.id));
        patch({ hasMore: page.hasMore });
        initialized = true;
      } else {
        // Fetch ascending afterId pages to avoid skipping a burst larger than one page.
        // A newly sent message may have a higher ID than incoming messages we have
        // not fetched yet. Never advance the polling cursor from a send response.
        let cursor = newestFetched;
        if (cursor) {
          for (;;) {
            const page = await api.messages({ afterId: cursor, size: 100 });
            merge(page.messages);
            const next = Math.max(cursor, ...page.messages.map(message => message.id));
            newestFetched = next;
            if (!page.hasMore || next === cursor) break;
            cursor = next;
          }
        }
        // Also refresh read receipts and the empty-conversation case.
        const latest = await api.messages({ size: 30 });
        merge(latest.messages);
        if (!cursor) {
          patch({ hasMore: latest.hasMore });
          newestFetched = Math.max(0, ...latest.messages.map(message => message.id));
        }
      }
      patch({ error: '' });
      await markRead();
    } catch (error) { patch({ error: errorMessage(error) }); }
    finally { refreshing = false; patch({ loading: false }); }
  };
  const loadOlder = async () => {
    const oldest = state.messages[0]?.id;
    if (!oldest || !state.hasMore || state.loadingOlder) return;
    patch({ loadingOlder: true });
    try {
      const page = await api.messages({ beforeId: oldest, size: 30 });
      merge(page.messages);
      patch({ hasMore: page.hasMore, error: '' });
    } catch (error) { patch({ error: errorMessage(error) }); }
    finally { patch({ loadingOlder: false }); }
  };
  const deliver = async (key: string) => {
    const pending = state.outgoing.find(message => message.key === key);
    if (!pending || pending.status === 'sending') return;
    const update = (changes: Partial<OutgoingMessage>) => patch({ outgoing: state.outgoing.map(message => message.key === key ? { ...message, ...changes } : message) });
    update({ status: 'sending', error: undefined });
    try {
      // Recheck server status before uploading or retrying a potentially closed ride.
      const ride = await api.ride();
      patch({ ride });
      if (!canDriverChat(ride)) throw new Error('Chuyến đã đóng trò chuyện. Bạn vẫn có thể xem tin nhắn.');
      let body = pending.body;
      if (pending.file && !body.attachmentUrl) {
        const image = await api.upload(pending.file);
        body = { ...body, attachmentUrl: image.secureUrl, attachmentPublicId: image.publicId };
        update({ body });
      }
      const sent = await api.send(body);
      merge([sent]);
    } catch (error) { update({ status: 'failed', error: errorMessage(error) }); }
  };
  const send = (text: string, file?: CustomerImageFile) => {
    if (!canDriverChat(state.ride) || (!text.trim() && !file)) return false;
    const key = uuid();
    patch({ outgoing: [...state.outgoing, {
      key, body: { clientMessageId: key, messageType: file ? 'IMAGE' : 'TEXT', content: text.trim() || null },
      file, createdAt: new Date().toISOString(), status: 'failed',
    }] });
    void deliver(key);
    return true;
  };
  const receivedReadReceipt = (upToMessageId: number) => {
    if (!Number.isSafeInteger(upToMessageId) || upToMessageId <= 0) return;
    const now = new Date().toISOString();
    patch({ messages: state.messages.map(message => message.senderRole === 'DRIVER' && message.id <= upToMessageId
      ? { ...message, readAt: message.readAt ?? now } : message) });
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setVisible: (value: boolean) => { visible = value; },
    refresh, loadOlder, send, retry: deliver, receivedReadReceipt,
  };
}
