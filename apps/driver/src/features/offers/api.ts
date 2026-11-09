import { request } from '@/lib/api';

import type { AuthProfile,CustomerRideDetail } from '@datxe/shared';
import { driverApi } from '@/lib/driverApi';
export const acceptDriverOffer = (rideId: number, offerId: string) => request<string>(`/driver/offers/${rideId}/accept`, { method: 'POST', body: { offerId } });
export const rejectDriverOffer = (rideId: number, offerId: string) => request(`/driver/offers/${rideId}/reject`, { method: 'POST', body: { offerId }, allowNull: true });
export const getHomeSession=()=>request<AuthProfile>('/auth/me');
export const getHomeActiveRide=()=>request<CustomerRideDetail>('/driver/rides/active',{allowNull:true});
export const getHomeVerification=driverApi.verification;
export const setDriverAvailability=(body:{online:boolean;vehicle_type?:'CAR'|'MOTORCYCLE'})=>request<{status:string}>('/driver/availability',{method:'PUT',body});

export type DriverDailySummary = { date: string; fullName: string | null; avatarUrl: string | null; completedTrips: number; income: number };
export const getHomeDailySummary = () => request<DriverDailySummary>('/driver/wallet/daily-summary');
