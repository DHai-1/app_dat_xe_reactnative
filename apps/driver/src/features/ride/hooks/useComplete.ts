import { useCallback } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { getDriverRide,confirmCashReceived } from '../api';
export function useComplete(){const {rideId}=useLocalSearchParams<{rideId?:string}>(),router=useRouter(),client=useQueryClient();const id=Number(rideId);const valid=Number.isSafeInteger(id)&&id>0;const query=useQuery({queryKey:['driver','ride',id],queryFn:()=>getDriverRide(id),enabled:valid});const refetch=query.refetch;useRefreshOnFocus(useCallback(()=>valid?refetch():undefined,[valid,refetch]));const cash=useMutation({mutationFn:()=>{if(!valid||query.data?.status!=='COMPLETED')throw new Error('Chuyến chưa hoàn tất.');return confirmCashReceived(id);},onSuccess:()=>client.invalidateQueries({queryKey:['driver','wallet']})});return {query,cash,router,valid};}
