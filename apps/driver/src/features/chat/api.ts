import { request } from '@/lib/api';
import { uploadDriverImage } from '@/lib/uploadImage';
import type { CustomerChatMessage, CustomerChatPage, CustomerChatSendRequest, CustomerChatPageOptions } from '@datxe/shared';

export async function getDriverChatMessages(rideId: number, options: CustomerChatPageOptions = {}) {
  const query = new URLSearchParams();
  if (options.beforeId !== undefined) query.set('beforeId', String(options.beforeId));
  if (options.afterId !== undefined) query.set('afterId', String(options.afterId));
  if (options.size !== undefined) query.set('size', String(options.size));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<CustomerChatPage>(`/chat/rides/${rideId}/messages${suffix}`);
}

export function sendDriverChatMessage(rideId: number, body: CustomerChatSendRequest) {
  return request<CustomerChatMessage>(`/chat/rides/${rideId}/messages`, { method: 'POST', body });
}

export function markDriverChatRead(rideId: number, upToMessageId: number) {
  return request(`/chat/rides/${rideId}/read`, { method: 'PUT', body: { upToMessageId } });
}

export function uploadDriverChatImage(rideId: number, file: { uri: string; fileName?: string | null; mimeType?: string | null }) {
  return uploadDriverImage(file, 'CHAT', rideId);
}
