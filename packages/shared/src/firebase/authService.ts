import {
FacebookAuthProvider,
GoogleAuthProvider,
PhoneAuthProvider,
getAuth,
linkWithCredential,
signInWithCredential,
signInWithPhoneNumber,
signOut,
verifyPhoneNumber,
type ConfirmationResult,
type PhoneAuthSnapshot,
type User,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { getAuthConfig } from './config';
import { runPushSignOutCleanup } from '../notifications/push';

export type AuthRole = 'customer' | 'driver';
export const AUTH_FULL_NAME_MAX_LENGTH = 120;

export type AuthProfile = {
  id: number;
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
  firebaseUid: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  verificationStatus?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export class AuthCancelledError extends Error {
  constructor() {
    super('Đã hủy đăng nhập');
    this.name = 'AuthCancelledError';
  }
}

export function getAuthFullNameValidationError(fullName: string): string | null {
  const normalized = fullName.trim();
  if (!normalized) return 'Họ và tên không được để trống.';
  if (normalized.length > AUTH_FULL_NAME_MAX_LENGTH) {
    return `Họ và tên không được dài quá ${AUTH_FULL_NAME_MAX_LENGTH} ký tự.`;
  }
  return null;
}

let pendingPhoneConfirmation: ConfirmationResult | null = null;
let pendingPhoneLink: { verificationId: string; user: User } | null = null;

export function normalizeVietnamPhoneNumber(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('84')) return `+${digits}`;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  return `+84${digits}`;
}

export function isValidVietnamPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('84')) return digits.length === 11;
  if (digits.startsWith('0')) return digits.length === 10;
  return digits.length === 9;
}

export function getFirebaseUser(): User | null {
  return getAuth().currentUser;
}

export async function sendPhoneCode(
  phoneNumber: string,
  options: { linkToCurrentAccount?: boolean } = {},
): Promise<{ autoVerified: boolean }> {
  const auth = getAuth();
  const formattedPhone = normalizeVietnamPhoneNumber(phoneNumber);
  pendingPhoneConfirmation = null;
  pendingPhoneLink = null;

  if (options.linkToCurrentAccount) {
    const user = auth.currentUser;
    if (!user) throw new AuthApiError('Vui lòng đăng nhập lại rồi thử tiếp.', 'NO_AUTH_USER');
    const listener = verifyPhoneNumber(auth, formattedPhone);
    const snapshot = await new Promise<PhoneAuthSnapshot>((resolve, reject) => {
      listener.on(
        'state_changed',
        (event) => {
          if (event.state === 'sent' || event.state === 'verified') resolve(event);
          if (event.state === 'error') reject(event.error ?? new Error('Không gửi được OTP.'));
        },
        reject,
      );
    });
    if (snapshot.state === 'verified' && snapshot.code) {
      await linkWithCredential(
        user,
        PhoneAuthProvider.credential(snapshot.verificationId, snapshot.code),
      );
      return { autoVerified: true };
    }
    pendingPhoneLink = { verificationId: snapshot.verificationId, user };
    return { autoVerified: false };
  }

  pendingPhoneConfirmation = await signInWithPhoneNumber(auth, formattedPhone);
  return { autoVerified: false };
}

export async function confirmPhoneCode(code: string): Promise<User> {
  const normalizedCode = code.replace(/\D/g, '');
  if (normalizedCode.length !== 6) {
    throw new AuthApiError('Vui lòng nhập đủ 6 chữ số OTP.', 'INVALID_OTP');
  }

  if (pendingPhoneLink) {
    const { user, verificationId } = pendingPhoneLink;
    const credential = PhoneAuthProvider.credential(verificationId, normalizedCode);
    const linked = await linkWithCredential(user, credential);
    pendingPhoneLink = null;
    return linked.user;
  }

  if (!pendingPhoneConfirmation) {
    throw new AuthApiError('Phiên xác minh đã hết hạn. Hãy gửi lại mã OTP.', 'OTP_EXPIRED');
  }
  const result = await pendingPhoneConfirmation.confirm(normalizedCode);
  pendingPhoneConfirmation = null;
  if (!result?.user) throw new AuthApiError('Không thể xác minh mã OTP.', 'OTP_INVALID');
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  if (Platform.OS === 'web') {
    throw new AuthApiError('Đăng nhập Google hiện chỉ hỗ trợ trên ứng dụng di động.', 'NATIVE_AUTH_REQUIRED');
  }
  const webClientId = getAuthConfig().googleWebClientId;
  if (!webClientId) {
    throw new AuthApiError('Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong cấu hình ứng dụng.', 'GOOGLE_CONFIG_MISSING');
  }
  GoogleSignin.configure({ webClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') throw new AuthCancelledError();
  const idToken = result.data.idToken;
  if (!idToken) {
    throw new AuthApiError(
      'Không nhận được Google ID token. Kiểm tra cấu hình OAuth của Firebase.',
      'GOOGLE_ID_TOKEN_MISSING',
    );
  }
  const credential = GoogleAuthProvider.credential(idToken);
  return (await signInWithCredential(getAuth(), credential)).user;
}

export async function signInWithFacebook(): Promise<User> {
  if (Platform.OS === 'web') {
    throw new AuthApiError('Đăng nhập Facebook hiện chỉ hỗ trợ trên ứng dụng di động.', 'NATIVE_AUTH_REQUIRED');
  }
  const appId = getAuthConfig().facebookAppId;
  const clientToken = getAuthConfig().facebookClientToken;
  if (!appId || !clientToken) {
    throw new AuthApiError(
      'Thiếu EXPO_PUBLIC_FACEBOOK_APP_ID hoặc EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN trong cấu hình ứng dụng.',
      'FACEBOOK_CONFIG_MISSING',
    );
  }
  // This package reads the native FBAccessToken module as soon as it is
  // imported. Load it only after the user chooses Facebook so missing or
  // uninitialized Facebook native configuration cannot crash app startup.
  const { AccessToken, LoginManager } = await import('react-native-fbsdk-next');
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) throw new AuthCancelledError();
  const token = await AccessToken.getCurrentAccessToken();
  if (!token?.accessToken) {
    throw new AuthApiError('Không nhận được Facebook access token.', 'FACEBOOK_TOKEN_MISSING');
  }
  const credential = FacebookAuthProvider.credential(token.accessToken);
  return (await signInWithCredential(getAuth(), credential)).user;
}

export async function authenticateWithBackend(
  role: AuthRole,
  user: User = requireCurrentUser(),
): Promise<AuthProfile> {
  const idToken = await user.getIdToken(true);
  const profile = await postAuthRequest<AuthProfile>(`/auth/${role}/login`, {
    idToken,
    phoneNumber: user.phoneNumber ?? undefined,
  }, role);
  getAuthConfig().onAuthenticated?.(profile);
  return profile;
}

export async function registerWithBackend(
  role: AuthRole,
  fullName: string,
  user: User = requireCurrentUser(),
): Promise<AuthProfile> {
  const normalizedFullName = fullName.trim();
  const validationError = getAuthFullNameValidationError(normalizedFullName);
  if (validationError) throw new AuthApiError(validationError, 'VALIDATION_ERROR');

  const idToken = await user.getIdToken(true);
  const profile = await postAuthRequest<AuthProfile>(`/auth/${role}/register`, {
    idToken,
    fullName: normalizedFullName,
    phoneNumber: user.phoneNumber ?? undefined,
  }, role);
  getAuthConfig().onAuthenticated?.(profile);
  return profile;
}

export async function signOutFirebase(): Promise<void> {
  pendingPhoneConfirmation = null;
  pendingPhoneLink = null;
  // Gỡ FCM token trước khi mất phiên đăng nhập, để thiết bị không nhận thông báo của tài khoản cũ.
  await runPushSignOutCleanup();
  await signOut(getAuth());
  getAuthConfig().onSignedOut?.();
}

function requireCurrentUser(): User {
  const user = getAuth().currentUser;
  if (!user) throw new AuthApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'NO_AUTH_USER');
  return user;
}

function getApiBaseUrl(): string { return getAuthConfig().apiUrl; }

async function postAuthRequest<T>(path: string, body: object, role: AuthRole): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Role': role.toUpperCase() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError(
      'Không kết nối được máy chủ. Kiểm tra backend và địa chỉ EXPO_PUBLIC_API_URL.',
      'NETWORK_ERROR',
    );
  }

  let result: ApiResponse<T>;
  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new AuthApiError('Máy chủ trả về dữ liệu không hợp lệ.', 'INVALID_SERVER_RESPONSE');
  }

  if (!response.ok || !result.success || result.data === undefined) {
    throw new AuthApiError(
      result.error?.message ?? 'Không thể xác thực với máy chủ.',
      result.error?.code ?? `HTTP_${response.status}`,
    );
  }
  return result.data;
}
