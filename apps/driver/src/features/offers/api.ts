import { request } from '@/lib/api';

import type { AuthProfile,CustomerRideDetail } from '@datxe/shared';
import { driverApi } from '@/lib/driverApi';
export type DriverOffer = { rideId: number; offerId: string; expiresAt: number; pickup: { lat: number; lng: number; address: string }; dropoff: { lat: number; lng: number; address: string }; pickupNote?: string | null; note?: string | null; tripDistanceKm: number; estDurationMin: number; fareEstimate: number; driverEarning: number; customer: { displayName: string }; vehicle: { type: string; transmission: string } };
export const getPendingOffer = () => request<DriverOffer>('/driver/offers/pending', { allowNull: true });
export const acceptDriverOffer = (rideId: number, offerId: string) =>
  request<string>(`/driver/offers/${rideId}/accept`, {
    method: 'POST',
    body: { offerId },
  });
export const rejectDriverOffer = (rideId: number) => request(`/driver/offers/${rideId}/reject`, { method: 'POST', allowNull: true });
export const getHomeSession=()=>request<AuthProfile>('/auth/me');
export const getHomeActiveRide=()=>request<CustomerRideDetail>('/driver/rides/active',{allowNull:true});
export const getHomeVerification=driverApi.verification;
export const setDriverAvailability=(body:{online:boolean;vehicle_type?:'CAR'|'MOTORCYCLE'})=>request<{status:string}>('/driver/availability',{method:'PUT',body});
