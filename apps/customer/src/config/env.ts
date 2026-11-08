import { translate as i18nT } from '@datxe/shared';
import { Platform } from 'react-native';
// Expo statically replaces direct EXPO_PUBLIC_* reads; keep them explicit.
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const staleMs = Number(process.env.EXPO_PUBLIC_LOCATION_STALE_MS);
export const env = {
  locationStaleMs: Number.isFinite(staleMs) && staleMs > 0 ? Math.max(5000, Math.min(300000, staleMs)) : 30000,
  apiUrl: apiUrl ? (apiUrl.endsWith('/api') ? apiUrl : apiUrl + '/api') : Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim(),
  facebookClientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN?.trim(),
  goongMapKey: process.env.EXPO_PUBLIC_GOONG_MAP_KEY?.trim(),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim(),
};
export function validateEnv() {
  if (!/^https?:\/\//.test(env.apiUrl)) throw new Error(i18nT("EXPO_PUBLIC_API_URL phải là URL HTTP(S)."));
  if (!__DEV__ && !apiUrl) throw new Error(i18nT("Thiếu EXPO_PUBLIC_API_URL cho production."));
}
