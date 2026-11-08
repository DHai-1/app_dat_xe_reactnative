import { request } from '@/lib/api';
import type { CustomerRideDetail, RideStatusResponse } from '@datxe/shared';
export const getDriverActiveRide = () => request<CustomerRideDetail>('/driver/rides/active', { allowNull: true });
export const progressDriverRide = (id: number, action: string) => request(`/driver/rides/${id}/${action}`, { method: 'POST', body: {} });
export const submitDriverHandover = (id: number, phase: 'pickup' | 'dropoff', body: { odometer: number; fuelLevel: number | null; notes: string | null; photos: { angle: string; fileUrl: string; publicId: string }[] }) => request(`/driver/rides/${id}/handover/${phase}`, { method: 'POST', body });
export const reviseDriverHandover = (id: number, phase: 'pickup' | 'dropoff', revision: number, report: Parameters<typeof submitDriverHandover>[2]) => request(`/driver/rides/${id}/handover/${phase}/revisions`, { method: 'POST', body: { revision, report } });

export const getDriverRide=(id:number)=>request<CustomerRideDetail>('/driver/rides/'+id);
export const confirmCashReceived=(id:number)=>request<{rideId:number;amount:number;status:NonNullable<CustomerRideDetail['payment']>['status'];paidAt:string|null}>('/driver/rides/'+id+'/payment/cash/confirm',{method:'POST'});

export const cancelDriverRide = (id: number, reason: string) =>
  request<RideStatusResponse>(`/driver/rides/${id}/cancel`, { method: 'POST', body: { reason } });
