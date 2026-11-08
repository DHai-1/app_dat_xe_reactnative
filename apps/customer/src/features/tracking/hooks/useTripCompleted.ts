import { localizedAlert } from '@datxe/ui';
import { AuthApiError, translate as i18nT } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { rateCustomerRide } from '../api';
import { useRideQuery } from './useRideQuery';
export function useTripCompleted() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useRideQuery(rideId);
const ride = query.data;
const [stars, setStars] = useState(5);
const [comment, setComment] = useState('');
const [saving, setSaving] = useState(false);
const valid = Number.isSafeInteger(rideId) && rideId > 0;
const refresh = query.refetch;
const error = !valid ? i18nT("Không có mã chuyến để tải hóa đơn và gửi đánh giá.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
const finish = async (skipRating = false) => {
    if (saving) return;
    if (!rideId) {
      if (skipRating) router.replace('/(tabs)/home');
      return;
    }
    setSaving(true);
    try {
      if (!skipRating) await rateCustomerRide(rideId, { stars, comment: comment.trim() || null, tags: null, tip: 0 });
      router.replace('/(tabs)/home');
    } catch (err) {
      if (err instanceof AuthApiError && err.code === 'RATING_ALREADY_EXISTS') {
        localizedAlert(i18nT("Đánh giá chuyến đi"), err.message);
        router.replace('/(tabs)/home');
        return;
      }
      localizedAlert(i18nT("Chưa gửi được đánh giá"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };
return { router, ride, stars, setStars, comment, setComment, saving, error, refresh, finish };
}
