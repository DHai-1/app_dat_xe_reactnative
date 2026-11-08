import { useQuery } from '@tanstack/react-query';
import { getCustomerRide } from '../api';
export function useRideQuery(rideId: number, poll = false) {
 return useQuery({ queryKey:['customer','getCustomerRide',rideId],queryFn:()=>getCustomerRide(rideId),enabled:Number.isInteger(rideId)&&rideId>0,refetchInterval:poll ? query => ['COMPLETED','CANCELLED','NO_DRIVER_FOUND','EXPIRED','FAILED_SYSTEM'].includes(query.state.data?.status ?? '') ? false : 6000 : false });
}
