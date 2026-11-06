import { localizedAlert } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { confirmCustomerHandover,getCustomerRide } from '../api';
export function useVehicleInspection() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string; phase?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const phase = (Array.isArray(params.phase) ? params.phase[0] : params.phase) === 'dropoff' ? 'DROPOFF' : 'PICKUP';
const query = useQuery({queryKey:['customer','getCustomerRide',rideId],queryFn:()=>getCustomerRide(rideId),enabled:rideId>0});
const ride = query.data;
const loading = query.isLoading;
const error = !rideId ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? '';
const [saving,setSaving] = useState(false);
const report = ride?.handoverReports.find(item=>item.phase===phase);
const refresh = () => query.refetch();
const confirm = async () => {
    if (!rideId || !report || report.confirmedByCustomer || saving) return;
    setSaving(true);
    try {
      await confirmCustomerHandover(rideId, phase === 'PICKUP' ? 'pickup' : 'dropoff');
      await refresh();
      localizedAlert(i18nT("Đã xác nhận"), i18nT("Xác nhận bàn giao đã được ghi nhận trên chuyến đi."), [{ text: 'Đóng', onPress: () => router.back() }]);
    } catch (err) {
      localizedAlert(i18nT("Không thể xác nhận"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };
return { router, phase, ride, loading, saving, error, report, confirm };
}
