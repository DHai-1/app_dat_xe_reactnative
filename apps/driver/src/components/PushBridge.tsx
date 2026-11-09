import { useDriverCredit } from '@/lib/useDriverCredit';
import { pendingOfferKey, usePendingOffer } from '@/lib/driverOffer';
import { offerRemainingMs } from '@/lib/offerTiming';
import { logError } from '@/lib/logger';
import { resolveDriverNotification } from '@/lib/notificationDestination';
import { pushRegistration } from '@/lib/push';
import { useSessionStore } from '@/lib/store';
import { driverRealtime } from '@/lib/realtime';
import {
  acknowledgePushOpen, createPushOpenCoordinator, initializePushPresentation, isPushForAccount,
  parsePushData, presentPushNotification, rememberPushOpen, requestPushPermission,
  setPushSignOutCleanup, subscribeToLocalPushOpens,
  subscribeToPushMessages, subscribeToRemotePushOpens, syncPushToken, unregisterPushToken,
  watchPushTokenRefresh, dismissOfferNotifications, positiveId, record, type PushEnvelope,
} from '@datxe/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { usePathname, useRootNavigationState, useRouter, useSegments, type Href } from 'expo-router';

export function PushBridge() {
  const userId = useSessionStore(state => state.user?.id);
  const online = useSessionStore(state => state.user?.status === 'ONLINE');
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments() as unknown as string[];
  const nav = useRootNavigationState();
  const latest = useRef({ router, ready: false });
  const authenticationScreen = segments[0] === '(auth)' && ['login', 'register', 'otp-verify'].includes(String(segments[1] ?? ''));
  const navigationReady = Boolean(nav?.key && userId && pathname !== '/' && !authenticationScreen);
  useEffect(() => { latest.current = { router, ready: navigationReady }; }, [router, navigationReady]);
  const credit = useDriverCredit();
  const pendingOffer = usePendingOffer(navigationReady && credit.allowed, online && credit.allowed);
  const displayedOffer = useRef<{ userId: number; offerId: string } | null>(null);
  useEffect(() => {
    const offer = pendingOffer.data;
    if (!navigationReady || !credit.allowed || !userId || AppState.currentState !== 'active' || !offer ||
        offerRemainingMs(offer, pendingOffer.dataUpdatedAt, Date.now()) <= 0) return;
    if (displayedOffer.current?.userId === userId && displayedOffer.current.offerId === offer.offerId) return;
    displayedOffer.current = { userId, offerId: offer.offerId };
    const destination = { pathname: '/ride/accept' as const, params: { rideId: String(offer.rideId) } };
    if (pathname === '/ride/accept') router.setParams(destination.params);
    else router.navigate(destination);
  }, [navigationReady, credit.allowed, userId, pendingOffer.data, pendingOffer.dataUpdatedAt, pathname, router]);
  const controller = useRef<ReturnType<typeof createPushOpenCoordinator> | null>(null);

  useEffect(() => {
    let stopped = false;
    const coordinator = createPushOpenCoordinator({
      session: () => {
        const user = useSessionStore.getState().user;
        return user?.role === 'DRIVER' ? { id: user.id, role: 'DRIVER' } : null;
      },
      ready: () => !stopped && latest.current.ready && AppState.currentState === 'active',
      resolve: resolveDriverNotification,
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
      const user = useSessionStore.getState().user;
      if (!user || !isPushForAccount(event, 'DRIVER', user.id) || AppState.currentState !== 'active') return;
      if (event.type === 'RIDE_OFFER' || event.type === 'OFFER_EXPIRED' || event.type === 'OFFER_CANCELLED') {
        // WS and FCM can deliver the same event. Both wake the same authoritative query.
        void client.invalidateQueries({ queryKey: pendingOfferKey }, { cancelRefetch: false });
        if (event.type !== 'RIDE_OFFER') {
          const rideId = positiveId(record(event.payload).rideId);
          if (rideId) void dismissOfferNotifications(rideId).catch(logError);
        }
      } else {
        void client.invalidateQueries({ queryKey: ['driver'] });
      }
      void presentPushNotification(event).catch(logError);
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
