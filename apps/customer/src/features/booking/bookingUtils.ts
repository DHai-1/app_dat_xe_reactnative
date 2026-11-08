import { translate as i18nT,getLocale } from '@datxe/shared';
import type { CustomerRideDetail, CustomerVoucher, RideCoordinates, RideEstimate, RideEstimateRequest } from '@datxe/shared';
import type { BookingPlace } from './types';

export const DEFAULT_MAP_CENTER: RideCoordinates = { lat: 21.0285, lng: 105.8542 };
export function activeRideDestination(ride: Pick<CustomerRideDetail, 'id' | 'status'>) {
  return {
    pathname: ride.status === 'PENDING' || ride.status === 'SEARCHING'
      ? '/ride/find-driver' as const : '/ride/tracking' as const,
    params: { rideId: String(ride.id) },
  };
}

export const money = (value: number) => i18nT("{0} đ", {"0": new Intl.NumberFormat(getLocale()).format(value)});
export function isCoordinate(point: RideCoordinates): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}
export function estimateRequest(pickup: BookingPlace | null, dropoff: BookingPlace | null, vehicleId: number | null, scheduledAt: string | null, voucherCode = ''): RideEstimateRequest {
  if (!pickup || !dropoff || !vehicleId || !isCoordinate(pickup.coordinate) || !isCoordinate(dropoff.coordinate)) throw new Error(i18nT("Hãy chọn đủ điểm đón, điểm đến và phương tiện."));
  if (pickup.address.length > 255 || dropoff.address.length > 255) throw new Error(i18nT("Địa chỉ quá dài. Hãy chọn địa chỉ cụ thể ngắn hơn."));
  if (Math.abs(pickup.coordinate.lat - dropoff.coordinate.lat) < 0.00001 && Math.abs(pickup.coordinate.lng - dropoff.coordinate.lng) < 0.00001) throw new Error(i18nT("Điểm đón và điểm đến cần khác nhau."));
  return { vehicleId, pickupAddress: pickup.address, pickupLat: pickup.coordinate.lat, pickupLng: pickup.coordinate.lng, dropoffAddress: dropoff.address, dropoffLat: dropoff.coordinate.lat, dropoffLng: dropoff.coordinate.lng, scheduledAt, voucher_code: voucherCode || null };
}
export function voucherUnavailable(voucher: CustomerVoucher, subtotal: number | undefined, now = Date.now()): string | null {
  if (Date.parse(voucher.validFrom) > now) return i18nT("Chưa đến thời gian áp dụng");
  if (Date.parse(voucher.validTo) <= now) return i18nT("Ưu đãi đã hết hạn");
  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) return i18nT("Đã hết lượt sử dụng");
  if (subtotal !== undefined && subtotal < voucher.minimumOrderAmount) return i18nT("Áp dụng từ {0}", {"0": money(voucher.minimumOrderAmount)});
  return null;
}
export function minimumFareAdjustment(quote: RideEstimate): number {
  return Math.max(0, quote.estimatedFare - quote.baseFare - quote.distanceFare - quote.waitingFare - quote.nightSurcharge - quote.returnFee);
}
