import { Platform } from 'react-native';
// Expo statically replaces direct EXPO_PUBLIC_* reads; keep them explicit.
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const locationInterval = Number(process.env.EXPO_PUBLIC_DRIVER_LOCATION_INTERVAL_MS);
export const env = {
  locationIntervalMs: Number.isFinite(locationInterval) && locationInterval > 0 ? Math.max(3000, Math.min(10000, locationInterval)) : 4000,
  apiUrl: apiUrl ? (apiUrl.endsWith('/api') ? apiUrl : apiUrl + '/api') : Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim(),
  facebookClientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN?.trim(),
  goongMapKey: process.env.EXPO_PUBLIC_GOONG_MAP_KEY?.trim(),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim(),
};
export function validateEnv() {
  if (!/^https?:\/\//.test(env.apiUrl)) throw new Error('EXPO_PUBLIC_API_URL phải là URL HTTP(S).');
  if (!__DEV__ && !apiUrl) throw new Error('Thiếu EXPO_PUBLIC_API_URL cho production.');
}
