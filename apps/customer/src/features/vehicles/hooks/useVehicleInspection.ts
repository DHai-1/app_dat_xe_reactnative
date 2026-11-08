import { localizedAlert } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { pickSupportImage } from '@/lib/supportImages';
import type { CustomerRideDetail, SupportImage } from '@datxe/shared';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { confirmCustomerHandover,getCustomerRide } from '../api';
export function useVehicleInspection() {
const router = useRouter();
const client = useQueryClient();
const params = useLocalSearchParams<{ rideId?: string; phase?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const phase = (Array.isArray(params.phase) ? params.phase[0] : params.phase) === 'dropoff' ? 'DROPOFF' : 'PICKUP';
const query = useQuery({queryKey:['customer','getCustomerRide',rideId],queryFn:()=>getCustomerRide(rideId),enabled:rideId>0,refetchInterval:5000});
const ride = query.data;
const loading = query.isLoading;
const valid = Number.isSafeInteger(rideId) && rideId > 0;
const error = !valid ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
const [saving,setSaving] = useState(false);
const report = ride?.handoverReports.find(item=>item.phase===phase);
const [correctionOpen, setCorrectionOpen] = useState(false);
const [reason, setReason] = useState('');
const [images, setImages] = useState<SupportImage[]>([]);
const [uploading, setUploading] = useState(false);
const revisions = useQuery({ queryKey: ['customer', 'handoverRevisions', rideId, phase, report?.revision], enabled: Boolean(report), queryFn: async () => (await request<{ revision: number; report: CustomerRideDetail['handoverReports'][number]; requestedAt: string }[]>(`/customer/rides/${rideId}/handover/${phase.toLowerCase()}/revisions`))! });
const correction = useMutation({
  mutationFn: async () => {
    if (!report || uploading || saving || reason.trim().length < 10) throw new Error('Nhập lý do từ 10 ký tự và chờ ảnh tải xong.');
    return request(`/customer/rides/${rideId}/handover/${phase.toLowerCase()}/corrections`, { method: 'POST', body: { revision: report.revision ?? 1, reason: reason.trim(), images } });
  },
  onSuccess: async () => { setCorrectionOpen(false); setReason(''); setImages([]); await client.invalidateQueries({ queryKey: ['customer'] }); },
  onError: () => { void query.refetch(); },
});
const refresh = () => query.refetch();
const confirm = async () => {
    if (!rideId || !report || report.confirmedByCustomer || report.correctionReason || saving || correction.isPending) return;
    setSaving(true);
    try {
      await confirmCustomerHandover(rideId, phase === 'PICKUP' ? 'pickup' : 'dropoff', report.revision ?? 1);
      await refresh();
      // The confirmed state is rendered inline. A delayed alert action could
      // otherwise close the completion screen after the driver finishes.

    } catch (err) {
      localizedAlert(i18nT("Không thể xác nhận"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };
const canReview = Boolean(report && !report.confirmedByCustomer && !report.correctionReason && ride?.status === (phase === 'PICKUP' ? 'VEHICLE_HANDOVER' : 'VEHICLE_RETURNED'));
return { router, phase, ride, loading, saving, error, report, confirm, canReview, correctionOpen, setCorrectionOpen, reason, setReason, images, setImages, uploading, setUploading, correction, pickSupportImage, revisions, refresh, valid };
}
