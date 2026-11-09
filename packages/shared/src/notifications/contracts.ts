import type { CustomerRideDetail } from '../types';

export type PushRole = 'CUSTOMER' | 'DRIVER';
export type PushEnvelope = {
  type: string;
  messageId?: string;
  payload?: unknown;
  recipientRole?: PushRole;
  recipientId?: number;
};
export const PUSH_CHANNEL = 'datxe-updates-v1';
export const OFFER_CHANNEL = 'datxe-offers-v1';
export const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function positiveId(value: unknown): number | null {
  const id = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export function parsePushData(data: unknown): PushEnvelope | null {
  const wire = record(data);
  if (typeof wire.payload !== 'string') return null;
  try {
    const parsed = record(JSON.parse(wire.payload));
    if (typeof parsed.type !== 'string' || !/^[A-Z_]{2,64}$/.test(parsed.type)) return null;
    const role = wire.recipientRole ?? parsed.recipientRole;
    const id = wire.recipientId ?? parsed.recipientId;
    if (role !== undefined && role !== 'CUSTOMER' && role !== 'DRIVER') return null;
    if (id !== undefined && !positiveId(id)) return null;
    return {
      type: parsed.type, payload: parsed.payload,
      messageId: typeof parsed.messageId === 'string' ? parsed.messageId : undefined,
      recipientRole: role as PushRole | undefined,
      recipientId: positiveId(id) ?? undefined,
    };
  } catch { return null; }
}
export function isPushForAccount(event: PushEnvelope, role: PushRole, id: number) {
  return (!event.recipientRole || event.recipientRole === role) && (!event.recipientId || event.recipientId === id);
}
export function pushKey(event: PushEnvelope) {
  return event.messageId ?? `${event.type}:${JSON.stringify(event.payload)}`;
}
export function offerDeadline(event: PushEnvelope) {
  const expires = Number(record(event.payload).expiresAt);
  return Number.isFinite(expires) && expires > 0 ? expires : 0;
}
export function pushPresentation(event: PushEnvelope, now = Date.now()) {
  if (event.type === 'TICKET_REPLY') {
    const payload = record(event.payload);
    return {
      title: typeof payload.title === 'string' ? payload.title : 'Hỗ trợ khách hàng: Có phản hồi mới',
      body: typeof payload.body === 'string' ? payload.body : 'Mở ứng dụng để xem phản hồi.',
      channelId: PUSH_CHANNEL,
    };
  }
  if (event.type === 'WITHDRAWAL_REVIEWED' || event.type === 'PAYMENT_UPDATED') {
    const payload = record(event.payload);
    return { title: typeof payload.title === 'string' ? payload.title : 'Kết quả yêu cầu rút tiền',
      body: typeof payload.body === 'string' ? payload.body : 'Mở ứng dụng để xem kết quả rút tiền.', channelId: PUSH_CHANNEL };
  }
  if (event.type === 'CHAT_READ') return null;
  if (event.type === 'RIDE_OFFER' && offerDeadline(event) <= now) return null;
  if (event.type === 'RIDE_ASSIGNED') {
    // The server now sends the plate and pickup ETA with the assignment.
    const payload = record(event.payload);
    const plate = typeof payload.licensePlate === 'string' ? payload.licensePlate.trim() : '';
    const eta = Number(payload.etaToPickupMin);
    const details = ['Tài xế đã nhận chuyến.'];
    if (plate) details.push(`Biển số ${plate}.`);
    if (Number.isFinite(eta) && eta > 0) details.push(`Đến điểm đón sau khoảng ${eta} phút.`);
    return { title: 'Đã có tài xế nhận chuyến', body: details.join(' '), channelId: PUSH_CHANNEL };
  }
  const titles: Record<string, string> = {
    RIDE_OFFER: 'Có yêu cầu chuyến mới', CHAT_MESSAGE: 'Có tin nhắn mới',
    RIDE_ASSIGNED: 'Đã có tài xế nhận chuyến', RIDE_COMPLETED: 'Chuyến đi đã hoàn tất',
    RIDE_CANCELLED: 'Chuyến đi đã bị hủy', RIDE_NO_DRIVER: 'Chưa tìm được tài xế',
    HANDOVER_CONFIRMED: 'Biên bản đã được xác nhận',
    OFFER_EXPIRED: 'Lời mời nhận chuyến đã hết hạn',
    OFFER_CANCELLED: 'Lời mời nhận chuyến đã hủy',
    DRIVER_DOCUMENT_REVIEWED: 'Có kết quả kiểm tra giấy tờ',
    DRIVER_VERIFICATION_UPDATED: 'Hồ sơ tài xế có cập nhật', DRIVER_FORCE_OFFLINE: 'Đã tạm ngừng nhận chuyến',
  };
  return {
    title: titles[event.type] ?? 'Cập nhật chuyến đi',
    // Keep addresses, chat text and identity documents off the lock screen.
    body: event.type === 'RIDE_OFFER' ? 'Mở ứng dụng để xem và nhận chuyến trước khi hết hạn.'
      : event.type === 'OFFER_EXPIRED' ? 'Lời mời nhận chuyến đã hết thời gian phản hồi.'
      : event.type === 'OFFER_CANCELLED' ? 'Lời mời nhận chuyến không còn khả dụng.'
      : 'Mở ứng dụng để xem thông tin mới nhất.',
    channelId: event.type === 'RIDE_OFFER' ? OFFER_CHANNEL : PUSH_CHANNEL,
  };
}

export type PushDestination = { pathname: string; params?: Record<string, string>; notice?: string };
type Ride = Pick<CustomerRideDetail, 'id' | 'status'>;
export type PushRouteApi = {
  ride: (id: number) => Promise<Ride>;
  pendingOffer?: () => Promise<{ rideId: number; expiresAt: number; serverTime?: number } | null>;
  activeRide?: () => Promise<Ride | null>;
};
const terminal = new Set(['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM']);
export async function resolvePushDestination(event: PushEnvelope, role: PushRole, api: PushRouteApi, now: () => number = Date.now): Promise<PushDestination> {
  if (event.type === 'TICKET_REPLY') {
    const ticketId = positiveId(record(event.payload).ticketId);
    return ticketId
      ? { pathname: '/tickets/[id]', params: { id: String(ticketId) } }
      : { pathname: '/(tabs)/notifications' };
  }
  if (event.type === 'PAYMENT_UPDATED') {
    const id = positiveId(record(event.payload).rideId);
    if (id) {
      await api.ride(id);
      return { pathname: role === 'DRIVER' ? '/ride/complete' : '/ride/completed', params: { rideId: String(id) } };
    }
  }
  if (event.type === 'WITHDRAWAL_REVIEWED' && role === 'DRIVER') {
    const id = positiveId(record(event.payload).withdrawalId);
    return { pathname: '/profile/withdraw', ...(id ? { params: { requestId: String(id) } } : {}) };
  }
  const id = positiveId(record(event.payload).rideId ?? record(event.payload).ride_id);
  if (event.type === 'RIDE_OFFER' && role === 'DRIVER' && id) {
    const offer = await api.pendingOffer?.();
    if (offer && offer.rideId === id && offer.expiresAt > (offer.serverTime ?? now())) return { pathname: '/ride/accept', params: { rideId: String(id) } };
    const active = await api.activeRide?.();
    if (active?.id === id && !terminal.has(active.status)) return { pathname: '/ride/in-progress' };
    return { pathname: '/(tabs)/home', notice: 'Yêu cầu chuyến này đã hết hạn hoặc không còn khả dụng.' };
  }
  // Offer closure is now pushed too. It must never open a ride screen: the driver
  // may no longer be assigned to that ride, so a stale fetch would route incorrectly.
  if (role === 'DRIVER' && ['OFFER_EXPIRED', 'OFFER_CANCELLED'].includes(event.type)) {
    return {
      pathname: '/(tabs)/home',
      notice: event.type === 'OFFER_EXPIRED' ? 'Lời mời nhận chuyến đã hết hạn.' : 'Lời mời nhận chuyến đã bị hủy.',
    };
  }
  if (role === 'DRIVER' && ['DRIVER_DOCUMENT_REVIEWED', 'DRIVER_VERIFICATION_UPDATED'].includes(event.type)) return { pathname: '/(auth)/approval-status' };
  if (!id) return { pathname: '/(tabs)/notifications' };
  const ride = await api.ride(id); // Authorize against the restored account; never trust a payload URL/status.
  if (event.type === 'CHAT_MESSAGE') return { pathname: '/chat', params: { rideId: String(id) } };
  if (role === 'DRIVER') return terminal.has(ride.status) || (api.activeRide && (await api.activeRide())?.id !== id)
    ? { pathname: '/ride/complete', params: { rideId: String(id) } }
    : { pathname: '/ride/in-progress' };
  if (ride.status === 'COMPLETED') return { pathname: '/ride/completed', params: { rideId: String(id) } };
  if (terminal.has(ride.status)) return { pathname: '/ride/[id]', params: { id: String(id), returnTo: 'notifications' } };
  return { pathname: ['PENDING', 'SEARCHING'].includes(ride.status) ? '/ride/find-driver' : '/ride/tracking', params: { rideId: String(id) } };
}
