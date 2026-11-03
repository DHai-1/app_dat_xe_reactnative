import { localizedAlert } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useScreenFocused } from '@/lib/useScreenFocused';
import type { CustomerNotification } from '@datxe/shared';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { getCustomerNotifications,getUnreadNotificationCount,markAllCustomerNotificationsRead,markCustomerNotificationRead } from '../api';
import { NotificationFilter,category } from '../components/NotificationScreenParts';
/** Tự làm mới hộp thư để nhận thông báo mới mà không cần bấm tải lại. */
const POLL_INTERVAL_MS = 20_000;
export function useNotification() {
const router = useRouter();
const focused = useScreenFocused();
const [refreshing, setRefreshing] = useState(false);
const [filter, setFilter] = useState<NotificationFilter>('all');
const client=useQueryClient();
const query=useQuery({queryKey:['customer','getCustomerNotifications'],queryFn:getCustomerNotifications,refetchOnMount:'always',refetchInterval:focused?POLL_INTERVAL_MS:false});
const unread=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount,refetchOnMount:'always',refetchInterval:focused?POLL_INTERVAL_MS:false});
useRefreshOnFocus(query.refetch);useRefreshOnFocus(unread.refetch);
const items=query.data ?? [];
const unreadCount=unread.data ?? 0;
const loading=query.isLoading || unread.isLoading;
const error=query.error?.message ?? unread.error?.message ?? '';
const refresh=async()=>{setRefreshing(true);try{await Promise.all([query.refetch(),unread.refetch()]);}finally{setRefreshing(false);}};
const markRead = async (item: CustomerNotification) => {
    if (item.readAt) return;
    try {
      await markCustomerNotificationRead(item.id);
      await client.invalidateQueries({queryKey:['customer']});
    } catch (err) {
      localizedAlert(i18nT("Không thể đánh dấu đã đọc"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    }
  };
const markAll = async () => {
    try {
      await markAllCustomerNotificationsRead();
      await client.invalidateQueries({queryKey:['customer']});
    } catch (err) {
      localizedAlert(i18nT("Không thể cập nhật thông báo"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    }
  };
const openNotification = async (item: CustomerNotification) => {
    await markRead(item);
    const payload = item.payload && typeof item.payload === 'object' ? item.payload as Record<string, unknown> : {};
    const rawRideId = payload.rideId ?? payload.ride_id;
    const rideId = typeof rawRideId === 'number' ? rawRideId : typeof rawRideId === 'string' ? Number(rawRideId) : NaN;
    if (Number.isSafeInteger(rideId) && rideId > 0) {
      router.push({ pathname: '/ride/[id]', params: { id: String(rideId), rideId: String(rideId), returnTo: 'notifications' } });
    }
  };
const visible = items.filter((item) => filter === 'all' || category(item.type) === filter);
return { router, filter, setFilter, items, unreadCount, loading, error, refreshing, refresh, markAll, openNotification, visible };
}
