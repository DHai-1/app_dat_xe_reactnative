import { translate as i18nT , AuthApiError,DEFAULT_PHONE_COUNTRY,authenticateWithBackend,confirmPhoneCode,getFirebaseUser,isValidInternationalPhoneNumber,sendPhoneCode,signOutFirebase,toInternationalPhoneNumber } from '@datxe/shared';
import { useRouter } from 'expo-router';
import { useEffect,useRef,useState } from 'react';
import {
Keyboard
} from 'react-native';
import { getPhoneError } from '../components/AddPhoneNumberScreenParts';
export function useAddPhoneNumber() {
const router = useRouter();
const [user] = useState(() => getFirebaseUser());
const isGoogleAccount = Boolean(user?.providerData.some((item) => item.providerId === 'google.com'));
const isFacebookAccount = Boolean(user?.providerData.some((item) => item.providerId === 'facebook.com'));
const accountProvider = isGoogleAccount ? 'Google' : isFacebookAccount ? 'Facebook' : 'PtitGo';
const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY);
// This ref also preserves the number while the form switches to OTP.
const phoneDraft = useRef('');
const [submittedPhone, setSubmittedPhone] = useState('');
const [otp, setOtp] = useState('');
const [otpStep, setOtpStep] = useState(false);
const [invalid, setInvalid] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');
const [notice, setNotice] = useState('');
useEffect(() => {
    if (!user) router.replace('/(auth)/login' as never);
  }, [router, user]);
const onChangePhone = (value: string) => {
    setInvalid(false);
    setError('');
    setNotice('');
    phoneDraft.current = value;
  };
const finishPhoneLink = async () => {
    const profile = await authenticateWithBackend('customer');
    if (profile.role !== 'CUSTOMER') {
      throw new AuthApiError(i18nT("Tài khoản này không phải tài khoản khách hàng."), 'ROLE_MISMATCH');
    }
    router.replace('/(tabs)/home' as never);
  };
const onSubmit = async () => {
    if (submitting) return;
    const phone = phoneDraft.current;
    if (!user) {
      router.replace('/(auth)/login' as never);
      return;
    }
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      if (otpStep) {
        if (!/^\d{6}$/.test(otp)) {
          setError(i18nT("Nhập mã OTP gồm 6 chữ số."));
          return;
        }
        Keyboard.dismiss();
        await confirmPhoneCode(otp);
        await finishPhoneLink();
        return;
      }
      if (!isValidInternationalPhoneNumber(phone, country)) {
        setInvalid(true);
        setError(i18nT("Nhập số điện thoại {0} hợp lệ.", {"0": country.name}));
        return;
      }
      Keyboard.dismiss();
      const result = await sendPhoneCode(toInternationalPhoneNumber(phone, country), { linkToCurrentAccount: true });
      if (result.autoVerified) {
        await finishPhoneLink();
        return;
      }
      setOtp('');
      setSubmittedPhone(phone);
      setOtpStep(true);
    } catch (cause) {
      if (cause instanceof AuthApiError && cause.code === 'ACCOUNT_NOT_FOUND') {
        router.replace('/(auth)/register' as never);
        return;
      }
      setError(getPhoneError(cause));
    } finally {
      setSubmitting(false);
    }
  };
const resendCode = async () => {
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await sendPhoneCode(toInternationalPhoneNumber(phoneDraft.current, country), { linkToCurrentAccount: true });
      if (result.autoVerified) {
        await finishPhoneLink();
        return true;
      }
      setOtp('');
      setNotice(i18nT("Mã mới đã được gửi."));
      return true;
    } catch (cause) {
      setError(getPhoneError(cause));
      return false;
    } finally {
      setSubmitting(false);
    }
  };
const switchAccount = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await signOutFirebase();
      router.replace('/(auth)/login' as never);
    } catch (cause) {
      setError(getPhoneError(cause));
      setSubmitting(false);
    }
  };
const changePhone = () => {
    if (submitting) return;
    setOtpStep(false);
    setOtp('');
    setInvalid(false);
    setError('');
    setNotice('');
  };

return { user, router, accountProvider, country, setCountry, initialPhone: submittedPhone, otp, setOtp, otpStep, invalid, setInvalid, submitting, error, setError, notice, setNotice, onChangePhone, onSubmit, resendCode, switchAccount, changePhone };
}
