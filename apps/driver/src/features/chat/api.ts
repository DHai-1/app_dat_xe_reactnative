import { request } from '@/lib/api';
import { driverApi } from '@/lib/driverApi';
import { uploadDriverImage } from '@/lib/uploadImage';
import type { CustomerChatMessage, CustomerChatPage, CustomerChatPageOptions, CustomerChatSendRequest, CustomerImageFile } from '@datxe/shared';

function required<T>(value: T | null): T {
  if (value === null) throw new Error('Máy chủ chưa trả về dữ liệu trò chuyện. Vui lòng thử lại.');
  return value;
}
export const getChatRide = async (rideId: number) => required(await driverApi.ride(rideId));

export async function getChatMessages(rideId: number, options: CustomerChatPageOptions = {}) {
  const query = new URLSearchParams();
  for (const key of ['beforeId', 'afterId', 'size'] as const) {
    if (options[key] !== undefined) query.set(key, String(options[key]));
  }
  return required(await request<CustomerChatPage>(`/chat/rides/${rideId}/messages?${query}`));
}

export async function sendChatMessage(rideId: number, body: CustomerChatSendRequest) {
  return required(await request<CustomerChatMessage>(`/chat/rides/${rideId}/messages`, { method: 'POST', body }));
}

export async function markChatRead(rideId: number, upToMessageId: number) {
  await request(`/chat/rides/${rideId}/read`, { method: 'PUT', body: { upToMessageId } });
}

export const uploadChatImage = (rideId: number, file: CustomerImageFile) => uploadDriverImage(file, 'CHAT', rideId);
