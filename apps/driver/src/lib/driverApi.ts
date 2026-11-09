import { request } from './api';
import type { CustomerRideDetail,CustomerRidePage,CustomerNotification,DriverProfile,DriverVerification,DriverDocument,DriverSkill,DriverWallet } from '@datxe/shared';
export type DriverCreditStatus = { creditBalance: number; minimumCredit: number; shortfall: number; canReceive: boolean; blocked: boolean; mockTopUpEnabled: boolean };
export const driverApi={
 creditStatus:()=>request<DriverCreditStatus>('/driver/wallet/credit-status'),
 profile:()=>request<DriverProfile>('/driver/profile'),
 verification:()=>request<DriverVerification>('/driver/verification'),
 documents:()=>request<DriverDocument[]>('/driver/documents'),
 skills:()=>request<DriverSkill[]>('/driver/skills'),
 wallet:()=>request<DriverWallet>('/driver/wallet'),
 rides:(page=0,status?:string)=>request<CustomerRidePage>('/driver/rides?'+new URLSearchParams({page:String(page),size:'20',...(status ? { status } : {})})),
 ride:(id:number)=>request<CustomerRideDetail>('/driver/rides/'+id),
 notificationCount:()=>request<{unread_count:number}>('/notifications/unread-count'),
 notifications:()=>request<CustomerNotification[]>('/notifications'),
 readNotification:(id:number)=>request('/notifications/'+id+'/read',{method:'PUT',allowNull:true}),
 readAllNotifications:()=>request('/notifications/read-all',{method:'PUT',allowNull:true}),
};
