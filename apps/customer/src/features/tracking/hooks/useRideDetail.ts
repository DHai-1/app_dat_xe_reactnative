import { translate as i18nT } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useRideQuery } from './useRideQuery';
export function useRideDetail() {
const router = useRouter();
const params = useLocalSearchParams<{ id?: string; rideId?: string; returnTo?: string }>();
const rideId = Number(Array.isArray(params.id ?? params.rideId) ? (params.id ?? params.rideId)?.[0] : params.id ?? params.rideId);
const query = useRideQuery(rideId);
const ride = query.data;
const valid = Number.isSafeInteger(rideId) && rideId > 0;
const error = !valid ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
const goBack = () => router.replace(returnTo === 'notifications' ? '/(tabs)/notifications' : returnTo === 'home' ? '/(tabs)/home' : '/(tabs)/history');
return { router, params, rideId, ride, error, goBack, refresh: query.refetch, valid };
}
