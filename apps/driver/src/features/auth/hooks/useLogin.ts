import { AuthApiError,AuthCancelledError,authenticateWithBackend,isValidVietnamPhoneNumber,normalizeVietnamPhoneNumber,sendPhoneCode,signInWithFacebook,signInWithGoogle } from '@datxe/shared';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SignInMethod,getErrorMessage,isAccountNotFound } from '../components/LoginScreenParts';
export function useLogin() {
const router = useRouter();
// Keep the latest phone for validation without controlling the input.
const phoneDraft = useRef('');
const setPhone = (text: string) => { phoneDraft.current = text; };
const [busy, setBusy] = useState<SignInMethod>(null);
const [error, setError] = useState('');
const continueWithPhone = async () => {
    const phone = phoneDraft.current;
    if (!isValidVietnamPhoneNumber(phone)) {
      setError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }
    setBusy('phone');
    setError('');
    try {
      const normalizedPhone = normalizeVietnamPhoneNumber(phone);
      await sendPhoneCode(normalizedPhone);
      router.push({ pathname: '/(auth)/otp-verify', params: { phone: normalizedPhone } } as never);
    } catch (cause) {
      setError(getErrorMessage(cause));
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
return { setPhone, busy, error, setError, continueWithPhone, continueWithSocial };
}
