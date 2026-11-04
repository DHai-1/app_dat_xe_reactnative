import type { PushRegistrationAdapter } from '@datxe/shared';
import { request } from './api';

/**
 * Cầu nối giữa module push dùng chung và API backend của app khách.
 * Token được backend lưu vào bảng `device_tokens` để gửi FCM khi STOMP không khả dụng.
 */
export const pushRegistration: PushRegistrationAdapter = {
  register: (registration) =>
    request('/device-tokens', { method: 'POST', body: registration }),
  unregister: (installationId) =>
    request(`/device-tokens/${encodeURIComponent(installationId)}`, {
      method: 'DELETE',
      allowNull: true,
    }),
};
