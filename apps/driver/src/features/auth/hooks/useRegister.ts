import { AuthApiError,authenticateWithBackend,confirmPhoneCode,getAuthFullNameValidationError,getFirebaseUser,isValidVietnamPhoneNumber,normalizeVietnamPhoneNumber,registerWithBackend,sendPhoneCode } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useRef,useState } from 'react';
import { getErrorMessage } from '../components/RegisterScreenParts';
export function useRegister() {
const router = useRouter();
const user = getFirebaseUser();
const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
// Read raw editor text at submit time, after the keyboard has composed it.
const nameDraft = useRef(user?.displayName ?? '');
const setFullName = (text: string) => { nameDraft.current = text; };
const initialPhone = user?.phoneNumber ?? (typeof phoneParam === 'string' ? phoneParam : '');
const phoneDraft = useRef(initialPhone);
const setPhone = (text: string) => { phoneDraft.current = text; };
const [code, setCode] = useState('');
const [codeSent, setCodeSent] = useState(false);
const [verifiedPhone, setVerifiedPhone] = useState(user?.phoneNumber ?? '');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
useEffect(() => {
    if (!user) router.replace('/(auth)/login' as never);
  }, [router, user]);
const sendCode = async () => {
    const phone = phoneDraft.current;
    if (!isValidVietnamPhoneNumber(phone)) {
      setError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return false;
    }
    setLoading(true);
    setError('');
    try {
      const result = await sendPhoneCode(phone, { linkToCurrentAccount: true });
      if (result.autoVerified) {
        const linkedUser = getFirebaseUser();
        setVerifiedPhone(linkedUser?.phoneNumber ?? normalizeVietnamPhoneNumber(phone));
        setCodeSent(false);
      } else {
        setCode("");
        setCodeSent(true);
      }
      return true;
    } catch (cause) {
      setError(getErrorMessage(cause));
      return false;
    } finally {
      setLoading(false);
    }
  };
const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      const linkedUser = await confirmPhoneCode(code);
      setVerifiedPhone(linkedUser.phoneNumber ?? normalizeVietnamPhoneNumber(phoneDraft.current));
      setCodeSent(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };
const submit = async () => {
    const fullName = nameDraft.current;
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
        // The phone can already own a driver profile even when this Firebase identity is new
        // (for example after the Firebase account was recreated). Signing in re-attaches it.
        if (
          cause instanceof AuthApiError &&
          (cause.code === 'ACCOUNT_ALREADY_EXISTS' || cause.code === 'PHONE_ALREADY_EXISTS')
        ) {
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

const resetCode = () => { setCode(""); setCodeSent(false); setError(""); };

return { resetCode, user, router, initialName: user?.displayName ?? '', setFullName, initialPhone, setPhone, code, setCode, codeSent, verifiedPhone, loading, error, setError, sendCode, verifyCode, submit };
}
