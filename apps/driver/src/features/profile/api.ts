import { request } from "@/lib/api";
export { driverApi as profileApi } from '@/lib/driverApi';

export const updateDriverIdentity = (body: { fullName: string; email: string | null; bankName?: string; bankAccountNumber?: string }) =>
  request<{ fullName: string | null; email: string | null; bankName: string | null; bankAccountNumber: string | null }>("/driver/profile/identity", { method: "PUT", body });

export const deleteDriverAccount = () => request("/auth/account", { method: "DELETE", allowNull: true });
