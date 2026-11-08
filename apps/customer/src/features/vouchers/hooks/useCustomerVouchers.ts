import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getCustomerVouchers } from '../api';
export function useCustomerVouchers() {
 const router=useRouter();const query=useQuery({queryKey:['customer','getCustomerVouchers'],queryFn:getCustomerVouchers});useRefreshOnFocus(query.refetch);
 return {router,vouchers:query.data ?? [],loading:query.isLoading,error:query.error?.message ?? '',refresh:query.refetch};
}
