import { request } from './api';
import type { CustomerRideDetail,CustomerRidePage,CustomerNotification,DriverProfile,DriverVerification,DriverDocument,DriverSkill,DriverWallet } from '@datxe/shared';
export const driverApi={
 deleteAccount:()=>request('/auth/account',{method:'DELETE'}),
 profile:()=>request<DriverProfile>('/driver/profile'),
 verification:()=>request<DriverVerification>('/driver/verification'),
 documents:()=>request<DriverDocument[]>('/driver/documents'),
 skills:()=>request<DriverSkill[]>('/driver/skills'),
 wallet:()=>request<DriverWallet>('/driver/wallet'),
 rides:(page=0)=>request<CustomerRidePage>('/driver/rides?'+new URLSearchParams({page:String(page),size:'20'})),
 ride:(id:number)=>request<CustomerRideDetail>('/driver/rides/'+id),
 notifications:()=>request<CustomerNotification[]>('/notifications'),
 readNotification:(id:number)=>request('/notifications/'+id+'/read',{method:'PUT',allowNull:true}),
 readAllNotifications:()=>request('/notifications/read-all',{method:'PUT',allowNull:true}),
};
