import { AuthApiError,AuthCancelledError,authenticateWithBackend,isValidVietnamPhoneNumber,normalizeVietnamPhoneNumber,sendPhoneCode,signInWithFacebook,signInWithGoogle } from '@datxe/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SignInMethod,getErrorMessage,isAccountNotFound } from '../components/LoginScreenParts';
import { configureDriverPhoneAuthForDev } from '../../../lib/phoneAuth';
export function useLogin() {
const router = useRouter();
const [phone, setPhone] = useState('');
const [busy, setBusy] = useState<SignInMethod>(null);
const [error, setError] = useState('');
const continueWithPhone = async () => {
    if (!isValidVietnamPhoneNumber(phone)) {
      setError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }
    setBusy('phone');
    setError('');
    try {
      const normalizedPhone = normalizeVietnamPhoneNumber(phone);
      configureDriverPhoneAuthForDev();
      await Promise.race([
        sendPhoneCode(normalizedPhone),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('FIREBASE_PHONE_AUTH_TIMEOUT')), 30000)),
      ]);
      router.push({ pathname: '/(auth)/otp-verify', params: { phone: normalizedPhone } } as never);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'FIREBASE_PHONE_AUTH_TIMEOUT'
        ? 'Xác minh Firebase đang bị treo. Hãy kiểm tra SHA Firebase hoặc thử lại.'
        : getErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  };
const continueWithSocial = async (method: Exclude<SignInMethod, 'phone' | null>) => {
    setBusy(method);
    setError('');
    try {
      const user = method === 'google' ? await signInWithGoogle() : await signInWithFacebook();
      try {
        const profile = await authenticateWithBackend('driver', user);
        if (profile.role !== 'DRIVER') {
          throw new AuthApiError('Tài khoản này không phải tài khoản tài xế.', 'ROLE_MISMATCH');
        }
        router.replace('/(tabs)/home' as never);
      } catch (cause) {
        if (isAccountNotFound(cause)) {
          router.replace('/(auth)/register' as never);
          return;
        }
        throw cause;
      }
    } catch (cause) {
      if (!(cause instanceof AuthCancelledError)) setError(getErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  };
return { phone, setPhone, busy, error, setError, continueWithPhone, continueWithSocial };
}
