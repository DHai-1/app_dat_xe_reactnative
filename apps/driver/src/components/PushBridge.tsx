import { logError } from '@/lib/logger';
import { request } from '@/lib/api';
import { pushRegistration } from '@/lib/push';
import { useSessionStore } from '@/lib/store';
import { driverRealtime } from '@/lib/realtime';
import { driverApi } from '@/lib/driverApi';
import {
  acknowledgePushOpen, createPushOpenCoordinator, initializePushPresentation, isPushForAccount,
  parsePushData, presentPushNotification, rememberPushOpen, requestPushPermission,
  resolvePushDestination, setPushSignOutCleanup, subscribeToLocalPushOpens,
  subscribeToPushMessages, subscribeToRemotePushOpens, syncPushToken, unregisterPushToken,
  watchPushTokenRefresh, dismissOfferNotifications, offerDeadline, positiveId, record, pushKey, type CustomerRideDetail, type PushEnvelope,
} from '@datxe/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { usePathname, useRootNavigationState, useRouter, useSegments, type Href } from 'expo-router';

export function PushBridge() {
  const userId = useSessionStore(state => state.user?.id);
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const nav = useRootNavigationState();
  const latest = useRef({ router, ready: false });
  const authenticationScreen = segments[0] === '(auth)' && ['login', 'register', 'otp-verify'].includes(String(segments[1] ?? ''));
  const navigationReady = Boolean(nav?.key && userId && pathname !== '/' && !authenticationScreen);
  useEffect(() => { latest.current = { router, ready: navigationReady }; }, [router, navigationReady]);
  const controller = useRef<ReturnType<typeof createPushOpenCoordinator> | null>(null);

  useEffect(() => {
    let stopped = false;
    const coordinator = createPushOpenCoordinator({
      session: () => {
        const user = useSessionStore.getState().user;
        return user?.role === 'DRIVER' ? { id: user.id, role: 'DRIVER' } : null;
      },
      ready: () => !stopped && latest.current.ready && AppState.currentState === 'active',
      resolve: event => resolvePushDestination(event, 'DRIVER', {
        ride: async id => { const ride = await driverApi.ride(id); if (!ride) throw new Error('Không tìm thấy chuyến.'); return ride; },
        pendingOffer: () => request<{ rideId: number; expiresAt: number }>('/driver/offers/pending', { allowNull: true }),
        activeRide: () => request<CustomerRideDetail>('/driver/rides/active', { allowNull: true }),
      }),
      navigate: ({ notice, ...destination }) => {
        latest.current.router.navigate(destination as Href);
        if (notice) Alert.alert('Yêu cầu không còn khả dụng', notice);
      },
      acknowledge: acknowledgePushOpen,
      error: (error, retry) => {
        logError(error);
        Alert.alert('Chưa mở được thông báo', 'Kiểm tra kết nối rồi thử lại.', [{ text: 'Đóng', style: 'cancel' }, { text: 'Thử lại', onPress: retry }]);
      },
    });
    controller.current = coordinator;
    const opened = (event: PushEnvelope) => { if (!stopped) void rememberPushOpen(event, coordinator.enqueue).catch(logError); };
    const stopRemote = subscribeToRemotePushOpens(opened);
    let stopLocal = () => {};
    void subscribeToLocalPushOpens(opened).then(stop => { if (stopped) stop(); else stopLocal = stop; }).catch(logError);
    const receive = (event: PushEnvelope) => {
      void client.invalidateQueries({ queryKey: ['driver'] });
      const user = useSessionStore.getState().user;
      if (!user || !isPushForAccount(event, 'DRIVER', user.id) || AppState.currentState !== 'active') return;
      void presentPushNotification(event).catch(logError);
      if (event.type === 'RIDE_OFFER' && offerDeadline(event) > Date.now()) coordinator.enqueue({ ...event, messageId: `foreground:${pushKey(event)}` });
      if (['OFFER_EXPIRED', 'OFFER_CANCELLED'].includes(event.type)) void dismissOfferNotifications(positiveId(record(event.payload).rideId) ?? undefined).catch(logError);
    };
    const stopMessages = subscribeToPushMessages(receive);
    const stopStomp = driverRealtime.subscribe('/user/queue/trip', message => {
      const event = parsePushData({ payload: message.body });
      if (event) receive(event);
    });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void client.invalidateQueries({ queryKey: ['driver'] });
        void coordinator.drain();
        void dismissOfferNotifications().catch(logError);
      }
    });
    setPushSignOutCleanup(async () => { coordinator.clear(); await unregisterPushToken(pushRegistration); });
    const stopTokenRefresh = watchPushTokenRefresh(pushRegistration);
    return () => {
      stopped = true; coordinator.clear(); controller.current = null;
      stopRemote(); stopLocal(); stopMessages(); stopStomp(); appState.remove(); stopTokenRefresh(); setPushSignOutCleanup(null);
    };
  }, [client]);
  useEffect(() => { void controller.current?.drain(); }, [userId, pathname, nav?.key, navigationReady]);
  useEffect(() => {
    if (!userId) return;
    void initializePushPresentation().then(requestPushPermission).then(() => syncPushToken(pushRegistration)).catch(logError);
  }, [userId]);
  return null;
}
