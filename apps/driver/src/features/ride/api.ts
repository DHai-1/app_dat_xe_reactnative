import { request } from '@/lib/api';
import type { CustomerRideDetail } from '@datxe/shared';
export const getDriverActiveRide = () => request<CustomerRideDetail>('/driver/rides/active', { allowNull: true });
export const progressDriverRide = (id: number, action: string) => request(`/driver/rides/${id}/${action}`, { method: 'POST', body: {} });
export const submitDriverHandover = (id: number, phase: 'pickup' | 'dropoff', body: { odometer: number; fuelLevel: number | null; notes: string | null; photos: { angle: string; fileUrl: string; publicId: string }[] }) => request(`/driver/rides/${id}/handover/${phase}`, { method: 'POST', body });

export const getDriverRide=(id:number)=>request<CustomerRideDetail>('/driver/rides/'+id);
export const confirmCashReceived=(id:number)=>request<{rideId:number;amount:number;status:string;paidAt:string|null}>('/driver/rides/'+id+'/payment/cash/confirm',{method:'POST'});
