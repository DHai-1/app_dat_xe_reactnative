import { translate as i18nT , AuthApiError,authenticateWithBackend,getAuthFullNameValidationError,getFirebaseUser,registerWithBackend } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useRef,useState } from 'react';
import { getCustomerProfile,updateCustomerProfile } from '../api';
import { isPastIsoDate } from '../components/RegisterScreenParts';
export function useRegister() {
const router = useRouter();
const [user] = useState(() => getFirebaseUser());
const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
// Read raw editor text at submit time, after the keyboard has composed it.
const nameDraft = useRef(user?.displayName ?? '');
const setFullName = (text: string) => { nameDraft.current = text; };
const emailDraft = useRef(user?.email ?? '');
const setEmail = (text: string) => { emailDraft.current = text; };
const [dateOfBirth, setDateOfBirth] = useState('');
const [gender, setGender] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
useEffect(() => {
    if (!user) router.replace('/(auth)/login' as never);
    else if (!user.phoneNumber) router.replace('/(auth)/add-phone-number' as never);
  }, [router, user]);
const submit = async () => {
    const fullName = nameDraft.current;
    const email = emailDraft.current;
    const nameError = getAuthFullNameValidationError(fullName);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!user?.phoneNumber) {
      router.replace('/(auth)/add-phone-number' as never);
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(i18nT("Email không hợp lệ."));
      return;
    }
    if (dateOfBirth && !isPastIsoDate(dateOfBirth)) {
      setError(i18nT("Ngày sinh cần đúng định dạng YYYY-MM-DD và nằm trong quá khứ."));
      return;
    }
    setLoading(true);
    setError('');
    try {
      try {
        await registerWithBackend('customer', fullName, user ?? undefined);
      } catch (cause) {
        // The phone can already own a profile even when this Firebase identity is new (for
        // example after the Firebase account was recreated). Signing in re-attaches it.
        if (
          cause instanceof AuthApiError &&
          (cause.code === 'ACCOUNT_ALREADY_EXISTS' || cause.code === 'PHONE_ALREADY_EXISTS')
        ) {
          await authenticateWithBackend('customer', user ?? undefined);
        } else {
          throw cause;
        }
      }
      const currentProfile = await getCustomerProfile();
      await updateCustomerProfile({
        full_name: fullName.trim(),
        email: email.trim() || user.email || currentProfile.email,
        date_of_birth: dateOfBirth || currentProfile.date_of_birth,
        gender: gender || currentProfile.gender,
        default_payment_method: currentProfile.default_payment_method,
      });
      router.replace('/(tabs)/home' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : i18nT("Không thể tạo tài khoản. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

return { user, router, phoneParam, initialName: user?.displayName ?? '', setFullName, initialEmail: user?.email ?? '', setEmail, dateOfBirth, setDateOfBirth, gender, setGender, loading, error, setError, submit };
}
