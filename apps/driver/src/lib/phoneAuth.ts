import { getAuth } from '@react-native-firebase/auth';

// Development-only convenience for the Android driver build. Production keeps
// Firebase App Check/reCAPTCHA enabled.
export function configureDriverPhoneAuthForDev() {
  if (__DEV__) getAuth().settings.appVerificationDisabledForTesting = true;
}
