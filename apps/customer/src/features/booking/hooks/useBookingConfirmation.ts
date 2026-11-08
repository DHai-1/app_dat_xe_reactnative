import { localizedAlert } from '@datxe/ui';
import { translate as i18nT , AuthApiError } from '@datxe/shared';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { createCustomerRide, getActiveCustomerRide, getCustomerVehicles, getCustomerVouchers, getRideEstimate } from '../api';
import { activeRideDestination, estimateRequest } from '../bookingUtils';
import { useBookingDraft } from '../store';

function friendlyPriceError(error: unknown): string {
  if (error instanceof AuthApiError && error.code === 'PRICING_RULE_NOT_FOUND') return i18nT("Hiện chưa có bảng giá cho phương tiện này. Bạn có thể chọn xe khác hoặc thử lại sau.");
  if (error instanceof AuthApiError && error.code === 'OUT_OF_SERVICE_AREA') return i18nT("Điểm đón hoặc điểm trả nằm ngoài vùng phục vụ. Vui lòng chọn điểm khác trong khu vực Hà Nội.");
  return error instanceof Error ? error.message : '';
}
export function useBookingConfirmation() {
  const router = useRouter();
  const client = useQueryClient();
  const draft = useBookingDraft();
  const [note, setNote] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [voucherVisible, setVoucherVisible] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  const vehicles = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles });
  const active = useQuery({ queryKey: ['customer', 'getActiveCustomerRide'], queryFn: getActiveCustomerRide, staleTime: 0 });
  useRefreshOnFocus(active.refetch);
  const vehicle = vehicles.data?.find(item => item.id === draft.vehicleId);
  let requestError = '';
  let input: ReturnType<typeof estimateRequest> | null = null;
  try { input = estimateRequest(draft.pickup, draft.dropoff, draft.vehicleId, scheduledAt, draft.voucherCode); }
  catch (error) { requestError = error instanceof Error ? error.message : i18nT("Thiếu thông tin chuyến."); }
  const keyFor = (request: ReturnType<typeof estimateRequest>) => ['customer', 'bookingEstimate', request] as const;
  const estimate = useQuery({ queryKey: input ? keyFor(input) : ['customer', 'bookingEstimate', 'incomplete'], queryFn: () => getRideEstimate(input!), enabled: Boolean(input && vehicle && !active.data), staleTime: 15000, retry: false });
  const vouchers = useQuery({ queryKey: ['customer', 'getCustomerVouchers'], queryFn: getCustomerVouchers, enabled: voucherVisible || Boolean(draft.voucherCode) });
  const selectedVoucher = vouchers.data?.find(item => item.code === draft.voucherCode);
  const error = requestError || friendlyPriceError(estimate.error) || vehicles.error?.message || active.error?.message || '';
  const ready = Boolean(input && vehicle && estimate.data && !estimate.isError && !estimate.isFetching && active.isSuccess && !active.isFetching && !active.data);
  const applyVoucher = async (code: string) => {
    if (!input || applyingCode !== null) return;
    setApplyingCode(code); setVoucherError('');
    try {
      const nextInput = { ...input, voucher_code: code || null };
      await client.fetchQuery({ queryKey: keyFor(nextInput), queryFn: () => getRideEstimate({ ...nextInput, routeQuoteId: estimate.data?.route?.id }), staleTime: 0 });
      draft.setVoucher(code); setVoucherVisible(false);
    } catch (cause) { setVoucherError(friendlyPriceError(cause) || 'Ưu đãi chưa thể áp dụng cho chuyến này.'); }
    finally { setApplyingCode(null); }
  };
  const create = useMutation({
    mutationFn: async () => {
      if (!ready || !input || !estimate.data) throw new Error(i18nT("Vui lòng chờ báo giá mới nhất trước khi đặt chuyến."));
      if (scheduledAt && Date.parse(scheduledAt) <= Date.now()) throw new Error(i18nT("Giờ hẹn đã qua. Hãy chọn lại thời gian đón."));
      const currentRide = await getActiveCustomerRide();
      if (currentRide) { client.setQueryData(['customer', 'getActiveCustomerRide'], currentRide); router.replace(activeRideDestination(currentRide)); return null; }
      const latest = await getRideEstimate({ ...input, routeQuoteId: estimate.data.route?.id });
      client.setQueryData(keyFor(input), latest);
      if (latest.payableFare !== estimate.data.payableFare) {
        localizedAlert(i18nT("Giá chuyến đã cập nhật"), i18nT("Vui lòng kiểm tra tổng thanh toán mới và nhấn đặt chuyến lần nữa."));
        return null;
      }
      const payload = { ...input, routeQuoteId: latest.route?.id, type: scheduledAt ? 'SCHEDULED' as const : 'INSTANT' as const, paymentMethod: 'CASH' as const, note: note.trim() || null, pickupNote: draft.pickupNote.trim() || null };
      const fingerprint = JSON.stringify(payload);
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      return createCustomerRide(payload, attempt.current.key);
    },
    onSuccess: async ride => {
      if (!ride) return;
      draft.clear();
      router.replace({ pathname: '/ride/find-driver', params: { rideId: String(ride.id) } });
      await client.invalidateQueries({ queryKey: ['customer'] });
    },
    onError: async error => {
      if (error instanceof AuthApiError && ['ACTIVE_RIDE_EXISTS', 'CONFLICT'].includes(error.code)) {
        const currentRide = await getActiveCustomerRide().catch(() => null);
        if (currentRide) {
          client.setQueryData(['customer', 'getActiveCustomerRide'], currentRide);
          router.replace(activeRideDestination(currentRide));
          return;
        }
        void estimate.refetch();
      }
      localizedAlert(i18nT("Chưa thể đặt chuyến"), friendlyPriceError(error) || error.message);
    },
    onSettled: () => { submitting.current = false; },
  });
  const book = () => { if (ready && !submitting.current) { submitting.current = true; create.mutate(); } };
  const openSchedule = () => {
    const first = Math.ceil((Date.now() + 15 * 60000) / (30 * 60000)) * 30 * 60000;
    setSlots(Array.from({ length: 48 }, (_, index) => new Date(first + index * 30 * 60000).toISOString()));
    setScheduleVisible(true);
  };
  return { router, draft, vehicle, route: estimate.data?.route?.coordinates, routeLoading: estimate.isFetching, estimate: estimate.data, estimating: estimate.isFetching, error, ready, note, setNote, scheduledAt, setScheduledAt, scheduleVisible, setScheduleVisible, slots, openSchedule, voucherVisible, setVoucherVisible, voucherError, applyingCode, applyVoucher, vouchers: vouchers.data ?? [], vouchersLoading: vouchers.isLoading, vouchersError: vouchers.error?.message, retryVouchers: vouchers.refetch, selectedVoucher, retryPrice: estimate.refetch, activeRide: active.data, book, submitting: create.isPending };
}
