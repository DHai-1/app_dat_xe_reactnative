import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

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
export type PushEnvelope = {
  type: string;
  messageId?: string;
  payload?: unknown;
};

const INSTALLATION_ID_KEY = 'datxe.push.installationId';
const ANDROID_NOTIFICATION_PERMISSION_API = 33;
const TOKEN_TIMEOUT_MS = 10_000;
const SIGN_OUT_TIMEOUT_MS = 3_000;

let installationIdPromise: Promise<string> | null = null;
let signOutCleanup: (() => Promise<void>) | null = null;

/**
 * Expo Go không chứa native module của React Native Firebase Messaging.
 * Giữ phần push là tuỳ chọn để app vẫn chạy được trong Expo Go; FCM sẽ được
 * bật đầy đủ khi chạy development build/release build có native Firebase.
 */
function getMessagingSafely() {
  try {
    return getMessaging();
  } catch {
    return null;
  }
}

export function isPushSupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
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
    const messaging = getMessagingSafely();
    if (!messaging) return false;
    const status = await requestPermission(messaging);
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
    const messaging = getMessagingSafely();
    if (!messaging) return 'denied';
    const status = await hasPermission(messaging);
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
  const messaging = getMessagingSafely();
  if (!messaging) return null;
  const fcmToken = await withTimeout(getToken(messaging), TOKEN_TIMEOUT_MS);
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
    const messaging = getMessagingSafely();
    if (!messaging) return () => {};
    return onTokenRefresh(messaging, (token) => {
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
    const messaging = getMessagingSafely();
    if (!messaging) return () => {};
    return onMessage(messaging, (message) => {
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
  const raw = message.data?.payload;
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PushEnvelope> | null;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string' || !parsed.type) return null;
    return {
      type: parsed.type,
      messageId: typeof parsed.messageId === 'string' ? parsed.messageId : undefined,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

/**
 * Data message khi app ở background/đã thoát. Backend hiện gửi data-only nên handler
 * chỉ giữ app thức dậy; nội dung hiển thị do lớp thông báo của hệ điều hành/app đảm nhận.
 */
export function registerPushBackgroundHandler(): void {
  if (!isPushSupported()) return;
  try {
    const messaging = getMessagingSafely();
    if (!messaging) return;
    setBackgroundMessageHandler(messaging, async () => undefined);
  } catch {
    // FCM chưa được cấu hình trên máy (ví dụ dev client thiếu google-services.json).
  }
}

registerPushBackgroundHandler();
