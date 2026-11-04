import { logError } from '@/lib/logger';
import { pushRegistration } from '@/lib/push';
import { useSessionStore } from '@/lib/store';
import {
  requestPushPermission,
  setPushSignOutCleanup,
  subscribeToPushMessages,
  syncPushToken,
  unregisterPushToken,
  watchPushTokenRefresh,
} from '@datxe/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Giữ FCM token của tài xế đồng bộ với backend và làm mới dữ liệu khi có push.
 * Token được gỡ trước khi đăng xuất để máy không nhận thông báo của tài khoản cũ.
 */
export function PushBridge() {
  const userId = useSessionStore((state) => state.user?.id);
  const client = useQueryClient();

  useEffect(() => {
    setPushSignOutCleanup(() => unregisterPushToken(pushRegistration));
    const stopTokenRefresh = watchPushTokenRefresh(pushRegistration);
    const stopMessages = subscribeToPushMessages(() => {
      // Backend chỉ đẩy FCM khi hàng đợi STOMP không khả dụng, nên tải lại để offer hiện ra.
      void client.invalidateQueries({ queryKey: ['driver'] });
    });
    return () => {
      stopTokenRefresh();
      stopMessages();
      setPushSignOutCleanup(null);
    };
  }, [client]);

  useEffect(() => {
    if (!userId) return;
    void requestPushPermission()
      .then(() => syncPushToken(pushRegistration))
      .catch(logError);
  }, [userId]);

  return null;
}
