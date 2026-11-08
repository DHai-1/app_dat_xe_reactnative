import { logError } from '@/lib/logger';
import { customerApi } from '@/lib/customerApi';
import { pushRegistration } from '@/lib/push';
import { useRideCompletion } from '@/lib/useRideCompletion';
import { useSessionStore } from '@/lib/store';
import {
  acknowledgePushOpen, createPushOpenCoordinator, initializePushPresentation, isPushForAccount,
  positiveId, record, presentPushNotification, rememberPushOpen, requestPushPermission, resolvePushDestination,
  setPushSignOutCleanup, subscribeToLocalPushOpens, subscribeToPushMessages, subscribeToRemotePushOpens,
  syncPushToken, unregisterPushToken, watchPushTokenRefresh, type PushEnvelope,
} from '@datxe/shared';
import { useQueryClient } from '@tanstack/react-query';
import { localizedAlert } from '@datxe/ui';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname, useRootNavigationState, useRouter, useSegments, type Href } from 'expo-router';

export function PushBridge() {
  const userId = useSessionStore(state => state.user?.id);
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const nav = useRootNavigationState();
  const latest = useRef({ router, ready: false });
  const authenticationScreen = segments[0] === '(auth)' && ['login', 'register', 'otp-verify', 'add-phone-number'].includes(String(segments[1] ?? ''));
  const navigationReady = Boolean(nav?.key && userId && pathname !== '/' && !authenticationScreen);
  useEffect(() => { latest.current = { router, ready: navigationReady }; }, [router, navigationReady]);
  const verifyCompletion = useRideCompletion(userId, navigationReady, pathname);
  const controller = useRef<ReturnType<typeof createPushOpenCoordinator> | null>(null);
  useEffect(() => {
    let stopped = false;
    const coordinator = createPushOpenCoordinator({
      session: () => {
        const user = useSessionStore.getState().user;
        return user?.role === 'CUSTOMER' ? { id: user.id, role: 'CUSTOMER' } : null;
      },
      ready: () => !stopped && latest.current.ready && AppState.currentState === 'active',
      resolve: event => resolvePushDestination(event, 'CUSTOMER', { ride: customerApi.getCustomerRide }),
      navigate: ({ notice: _notice, ...destination }) => {
        if (destination.pathname === '/ride/completed') latest.current.router.navigate(destination as Href);
        else latest.current.router.push(destination as Href);
      },
      acknowledge: acknowledgePushOpen,
      error: (error, retry) => {
        logError(error);
        localizedAlert('Chưa mở được thông báo', 'Kiểm tra kết nối rồi thử lại.', [{ text: 'Đóng', style: 'cancel' }, { text: 'Thử lại', onPress: retry }]);
      },
    });
    controller.current = coordinator;
    const opened = (event: PushEnvelope) => { if (!stopped) void rememberPushOpen(event, coordinator.enqueue).catch(logError); };
    const stopRemote = subscribeToRemotePushOpens(opened);
    let stopLocal = () => {};
    void subscribeToLocalPushOpens(opened).then(stop => { if (stopped) stop(); else stopLocal = stop; }).catch(logError);
    const stopMessages = subscribeToPushMessages(event => {
      const user = useSessionStore.getState().user;
      if (!user || !isPushForAccount(event, 'CUSTOMER', user.id)) return;
      void client.invalidateQueries({ queryKey: ['customer'] }, { cancelRefetch: false });
      if (event.type === 'RIDE_COMPLETED') {
        const id = positiveId(record(event.payload).rideId);
        if (id) void verifyCompletion(id, user.id).catch(logError);
      }
      if (AppState.currentState === 'active') void presentPushNotification(event).catch(logError);
    });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void client.invalidateQueries({ queryKey: ['customer'] });
        void coordinator.drain();
      }
    });
    setPushSignOutCleanup(async () => { coordinator.clear(); await unregisterPushToken(pushRegistration); });
    const stopTokenRefresh = watchPushTokenRefresh(pushRegistration);
    return () => {
      stopped = true; coordinator.clear(); controller.current = null;
      stopRemote(); stopLocal(); stopMessages(); appState.remove(); stopTokenRefresh(); setPushSignOutCleanup(null);
    };
  }, [client, verifyCompletion]);
  useEffect(() => { void controller.current?.drain(); }, [userId, pathname, nav?.key, navigationReady]);
  useEffect(() => {
    if (!userId) return;
    void initializePushPresentation().then(requestPushPermission).then(() => syncPushToken(pushRegistration)).catch(logError);
  }, [userId]);
  return null;
}
