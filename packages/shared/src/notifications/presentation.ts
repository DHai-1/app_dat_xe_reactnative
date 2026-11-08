import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { OFFER_CHANNEL, PUSH_CHANNEL, offerDeadline, parsePushData, positiveId, record, pushKey, pushPresentation, type PushEnvelope } from './contracts';

const PENDING_KEY = 'datxe.push.pendingOpen.v1';
const HANDLED_KEY = 'datxe.push.handledOpens.v1';
const shown = new Set<string>();
const handled = new Set<string>();
async function handledKeys(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HANDLED_KEY);
    const keys: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string') : [];
  } catch { return []; }
}
let initialized: Promise<typeof import('expo-notifications')> | undefined;
export async function initializePushPresentation() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  initialized ??= (async () => {
    const notifications = await import('expo-notifications');
    notifications.setNotificationHandler({ handleNotification: async notification => {
      // Remote FCM is silent in foreground; only our deduplicated local banner is presented.
      const local = notification.request.identifier.startsWith('datxe:');
      return { shouldShowBanner: local, shouldShowList: local, shouldPlaySound: local, shouldSetBadge: false };
    } });
    if (Platform.OS === 'android') {
      // Omit channel sound to use Android's default; a string names a bundled custom sound.
      await notifications.setNotificationChannelAsync(PUSH_CHANNEL, {
        name: 'Chuyến đi và tin nhắn', importance: notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200], lockscreenVisibility: notifications.AndroidNotificationVisibility.PRIVATE,
      });
      await notifications.setNotificationChannelAsync(OFFER_CHANNEL, {
        name: 'Yêu cầu chuyến mới', importance: notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 150, 400], lockscreenVisibility: notifications.AndroidNotificationVisibility.PRIVATE,
      });
    }
    return notifications;
  })();
  try { return await initialized; }
  catch (error) { initialized = undefined; throw error; }
}

export async function presentPushNotification(event: PushEnvelope) {
  const content = pushPresentation(event);
  const key = pushKey(event);
  if (!content || shown.has(key)) return;
  shown.add(key);
  if (shown.size > 200) shown.delete(shown.values().next().value!);
  try {
    const notifications = await initializePushPresentation();
    if (!notifications) return;
    // Avoid displaying an offer which expired while native initialization was running.
    if (event.type === 'RIDE_OFFER' && offerDeadline(event) <= Date.now()) return;
    await notifications.scheduleNotificationAsync({
      identifier: `datxe:${key}`,
      content: { title: content.title, body: content.body, sound: 'default',
        priority: notifications.AndroidNotificationPriority.HIGH,
        data: { payload: JSON.stringify(event) } },
      trigger: Platform.OS === 'android' ? { channelId: content.channelId } : null,
    });
  } catch (error) { shown.delete(key); throw error; }
}

export async function clearPushNotifications() {
  shown.clear();
  await AsyncStorage.removeItem(PENDING_KEY);
  const notifications = await initializePushPresentation();
  if (notifications) {
    await notifications.clearLastNotificationResponseAsync();
    await notifications.dismissAllNotificationsAsync();
  }
}
export async function dismissOfferNotifications(rideId?: number) {
  const notifications = await initializePushPresentation();
  if (!notifications) return;
  for (const notification of await notifications.getPresentedNotificationsAsync()) {
    const event = parsePushData(notification.request.content.data);
    if (event?.type === 'RIDE_OFFER' && (offerDeadline(event) <= Date.now() || (rideId && positiveId(record(event.payload).rideId) === rideId))) {
      await notifications.dismissNotificationAsync(notification.request.identifier);
    }
  }
}
export async function acknowledgePushOpen(event: PushEnvelope) {
  const key = pushKey(event);
  handled.add(key);
  if (handled.size > 100) handled.delete(handled.values().next().value!);
  const keys = await handledKeys();
  await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify([...keys.filter(value => value !== key), key].slice(-100)));
  const pending = await AsyncStorage.getItem(PENDING_KEY);
  if (pending && pushKey(JSON.parse(pending)) === key) await AsyncStorage.removeItem(PENDING_KEY);
}
export async function rememberPushOpen(event: PushEnvelope, listener: (event: PushEnvelope) => void) {
  const keys = await handledKeys();
  if (handled.has(pushKey(event)) || keys.includes(pushKey(event))) return;
  // Storage trouble must not prevent a tapped notification from opening this session.
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(event)).catch(() => {});
  listener(event);
}
export async function subscribeToLocalPushOpens(listener: (event: PushEnvelope) => void) {
  const notifications = await initializePushPresentation();
  if (!notifications) return () => {};
  const receive = (response: import('expo-notifications').NotificationResponse | null) => {
    if (!response || response.actionIdentifier !== notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const event = parsePushData(response.notification.request.content.data);
    if (event) listener(event);
  };
  const sub = notifications.addNotificationResponseReceivedListener(receive);
  // Register the listener first, then inspect the cold-start response.
  receive(await notifications.getLastNotificationResponseAsync());
  const pending = await AsyncStorage.getItem(PENDING_KEY);
  if (pending) {
    const event = parsePushData({ payload: pending });
    if (event) listener(event);
  }
  return () => sub.remove();
}
