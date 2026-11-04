import { AuthApiError,authenticateWithBackend,confirmPhoneCode,getAuthFullNameValidationError,getFirebaseUser,isValidVietnamPhoneNumber,normalizeVietnamPhoneNumber,registerWithBackend,sendPhoneCode } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { getErrorMessage } from '../components/RegisterScreenParts';
import { configureDriverPhoneAuthForDev } from '../../../lib/phoneAuth';
export function useRegister() {
const router = useRouter();
const user = getFirebaseUser();
const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
const [fullName, setFullName] = useState(user?.displayName ?? '');
const [phone, setPhone] = useState(user?.phoneNumber ?? (typeof phoneParam === 'string' ? phoneParam : ''));
const [code, setCode] = useState('');
const [codeSent, setCodeSent] = useState(false);
const [verifiedPhone, setVerifiedPhone] = useState(user?.phoneNumber ?? '');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
useEffect(() => {
    if (!user) router.replace('/(auth)/login' as never);
  }, [router, user]);
const sendCode = async () => {
    if (!isValidVietnamPhoneNumber(phone)) {
      setError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      configureDriverPhoneAuthForDev();
      const result = await sendPhoneCode(phone, { linkToCurrentAccount: true });
      if (result.autoVerified) {
        const linkedUser = getFirebaseUser();
        setVerifiedPhone(linkedUser?.phoneNumber ?? normalizeVietnamPhoneNumber(phone));
        setCodeSent(false);
      } else {
        router.push({ pathname: '/(auth)/register-otp', params: { phone: normalizeVietnamPhoneNumber(phone) } } as never);
      }
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };
const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      const linkedUser = await confirmPhoneCode(code);
      setVerifiedPhone(linkedUser.phoneNumber ?? normalizeVietnamPhoneNumber(phone));
      setCodeSent(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };
const submit = async () => {
    const nameError = getAuthFullNameValidationError(fullName);
    if (nameError) {
      setError(nameError);
      return;
    }
    const currentUser = getFirebaseUser();
    if (!currentUser?.phoneNumber) {
      setError('Tài xế cần xác minh số điện thoại trước khi tạo tài khoản.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      try {
        await registerWithBackend('driver', fullName, currentUser);
      } catch (cause) {
        if (cause instanceof AuthApiError && cause.code === 'ACCOUNT_ALREADY_EXISTS') {
          await authenticateWithBackend('driver', currentUser);
        } else {
          throw cause;
        }
      }
      router.replace('/(auth)/license-upload' as never);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

return { user, router, fullName, setFullName, phone, setPhone, code, setCode, codeSent, verifiedPhone, loading, error, setError, sendCode, verifyCode, submit };
}
