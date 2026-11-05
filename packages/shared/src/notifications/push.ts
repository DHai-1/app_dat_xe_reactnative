import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  getIsHeadless,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { parsePushData, type PushEnvelope, type PushRole } from './contracts';
import { clearPushNotifications, presentPushNotification } from './presentation';
export * from './contracts';
export * from './openCoordinator';
export { initializePushPresentation, presentPushNotification, clearPushNotifications, acknowledgePushOpen, rememberPushOpen, subscribeToLocalPushOpens, dismissOfferNotifications } from './presentation';

/**
 * Đăng ký FCM token của thiết bị với backend.
 *
 * Backend nhận `{ installationId, fcmToken, platform }` tại `POST /api/device-tokens` và
 * dùng `installationId` làm khoá ổn định cho mỗi lần cài app (token FCM có thể đổi).
 */
export type PushPlatform = 'ANDROID' | 'IOS';

export type PushTokenRegistration = {
  installationId: string;
  fcmToken: string;
  platform: PushPlatform;
};

export type PushRegistrationAdapter = {
  register: (registration: PushTokenRegistration) => Promise<unknown>;
  unregister: (installationId: string) => Promise<unknown>;
};

/** Envelope backend gửi trong data message: `{ type, payload, messageId }`. */
export type { PushEnvelope } from './contracts';

const INSTALLATION_ID_KEY = 'datxe.push.installationId';
const ANDROID_NOTIFICATION_PERMISSION_API = 33;
const TOKEN_TIMEOUT_MS = 10_000;
const SIGN_OUT_TIMEOUT_MS = 3_000;

let installationIdPromise: Promise<string> | null = null;
let signOutCleanup: (() => Promise<void>) | null = null;

export function isPushSupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}
export async function isPushHeadlessLaunch() {
  return Platform.OS === 'ios' ? getIsHeadless(getMessaging()) : false;
}

function pushPlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function createInstallationId(): string {
  // Chỉ dùng làm khoá cài đặt, không phải bí mật bảo mật, nên Math.random là đủ.
  const hex = '0123456789abcdef';
  let id = '';
  for (let index = 0; index < 36; index += 1) {
    if (index === 8 || index === 13 || index === 18 || index === 23) id += '-';
    else if (index === 14) id += '4';
    else if (index === 19) id += hex[((Math.random() * 4) | 0) + 8];
    else id += hex[(Math.random() * 16) | 0];
  }
  return id;
}

function getInstallationId(): Promise<string> {
  if (!installationIdPromise) {
    installationIdPromise = (async () => {
      const stored = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
      if (stored) return stored;
      const created = createInstallationId();
      await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
      return created;
    })();
    void installationIdPromise.catch(() => {
      // Lần sau thử lại thay vì giữ promise đã lỗi (ví dụ native module chưa được rebuild).
      installationIdPromise = null;
    });
  }
  return installationIdPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('PUSH_TIMEOUT')), timeoutMs)),
  ]);
}

/**
 * Xin quyền hiển thị thông báo. Không chặn việc đăng ký token: token vẫn nhận được
 * data message dù người dùng từ chối hiển thị.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < ANDROID_NOTIFICATION_PERMISSION_API) return true;
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await requestPermission(getMessaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

async function registerToken(adapter: PushRegistrationAdapter, fcmToken: string): Promise<void> {
  const installationId = await getInstallationId();
  await adapter.register({ installationId, fcmToken, platform: pushPlatform() });
}

/** Trạng thái quyền hiển thị thông báo, dùng cho màn cài đặt của app. */
export async function getPushPermissionStatus(): Promise<'granted' | 'denied'> {
  if (!isPushSupported()) return 'denied';
  try {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < ANDROID_NOTIFICATION_PERMISSION_API) return 'granted';
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return granted ? 'granted' : 'denied';
    }
    const status = await hasPermission(getMessaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
      ? 'granted'
      : 'denied';
  } catch {
    return 'denied';
  }
}

/** Lấy token FCM hiện tại và lưu lên backend; trả về installationId nếu thành công. */
export async function syncPushToken(adapter: PushRegistrationAdapter): Promise<string | null> {
  if (!isPushSupported()) return null;
  const fcmToken = await withTimeout(getToken(getMessaging()), TOKEN_TIMEOUT_MS);
  if (!fcmToken) return null;
  await registerToken(adapter, fcmToken);
  return getInstallationId();
}

/** Xoá token của thiết bị khỏi backend, dùng trước khi đăng xuất. */
export async function unregisterPushToken(adapter: PushRegistrationAdapter): Promise<void> {
  if (!isPushSupported()) return;
  const installationId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (!installationId) return;
  await adapter.unregister(installationId);
}

/** FCM cấp token mới (đổi máy/cài lại/mất token) thì đăng ký lại. */
export function watchPushTokenRefresh(adapter: PushRegistrationAdapter): () => void {
  if (!isPushSupported()) return () => {};
  try {
    return onTokenRefresh(getMessaging(), (token) => {
      void registerToken(adapter, token).catch(() => undefined);
    });
  } catch {
    return () => {};
  }
}

/** Nhận data message khi app đang mở. */
export function subscribeToPushMessages(listener: (envelope: PushEnvelope) => void): () => void {
  if (!isPushSupported()) return () => {};
  try {
    return onMessage(getMessaging(), (message) => {
      const envelope = parsePushEnvelope(message);
      if (envelope) listener(envelope);
    });
  } catch {
    return () => {};
  }
}

export function setPushSignOutCleanup(cleanup: (() => Promise<void>) | null): void {
  signOutCleanup = cleanup;
}

/** Chạy trước khi Firebase signOut để request vẫn còn token đăng nhập. */
export async function runPushSignOutCleanup(): Promise<void> {
  await withTimeout(clearPushNotifications(), SIGN_OUT_TIMEOUT_MS).catch(() => {});
  const cleanup = signOutCleanup;
  if (!cleanup) return;
  try {
    await Promise.race([
      cleanup(),
      new Promise<void>((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS)),
    ]);
  } catch {
    // Không được chặn đăng xuất vì lỗi mạng.
  }
}

export function parsePushEnvelope(message: RemoteMessage): PushEnvelope | null {
  return parsePushData(message.data);
}

/**
 * Registered by each app entry before Expo Router. Notification+data messages are
 * displayed by the OS; legacy data-only messages need local presentation.
 */
export function registerPushBackgroundHandler(role?: PushRole): void {
  if (!isPushSupported()) return;
  try {
    setBackgroundMessageHandler(getMessaging(), async message => {
      const event = parsePushEnvelope(message);
      if (event && (!event.recipientRole || !role || event.recipientRole === role) && !message.notification) await presentPushNotification(event);
    });
  } catch {
    // FCM chưa được cấu hình trên máy (ví dụ dev client thiếu google-services.json).
  }
}

/** Both FCM system notifications and local Expo notifications feed the same tap queue. */
export function subscribeToRemotePushOpens(listener: (event: PushEnvelope) => void): () => void {
  if (!isPushSupported()) return () => {};
  let stopped = false;
  const consume = (message: RemoteMessage | null) => {
    const event = message && parsePushEnvelope(message);
    if (!stopped && event) listener(event);
  };
  try {
    const stop = onNotificationOpenedApp(getMessaging(), consume);
    void getInitialNotification(getMessaging()).then(consume).catch(() => {});
    return () => { stopped = true; stop(); };
  } catch { return () => { stopped = true; }; }
}
