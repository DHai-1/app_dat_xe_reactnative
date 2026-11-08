import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useScreenFocused } from '@/lib/useScreenFocused';
import { useInfiniteQuery,useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { getCustomerRides,getUnreadNotificationCount } from '../api';
import type { Filter } from '../components/TripHistoryScreenParts';
/** Tự làm mới danh sách chuyến để luôn thấy chuyến mới nhất. */
const POLL_INTERVAL_MS=60_000;
export function useTripHistory() {
 const router=useRouter();
 const focused=useScreenFocused();
 const [filter,setFilter]=useState<Filter>('all');
 const [refreshing,setRefreshing]=useState(false);
 const status=filter==='completed'?'COMPLETED':filter==='cancelled'?'CANCELLED,NO_DRIVER_FOUND,EXPIRED,FAILED_SYSTEM':undefined;
 const query=useInfiniteQuery({queryKey:['customer','getCustomerRides',status],initialPageParam:0,queryFn:({pageParam})=>getCustomerRides(pageParam,20,status),getNextPageParam:last=>last.hasNext?last.page+1:undefined,refetchOnMount:'always',refetchInterval:focused?POLL_INTERVAL_MS:false});
 const unread=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount,refetchOnMount:'always',refetchInterval:focused?POLL_INTERVAL_MS:false});
 useRefreshOnFocus(query.refetch);useRefreshOnFocus(unread.refetch);
 const pages=query.data?.pages ?? [];
 const load=(_nextPage=0,append=false)=>append?query.fetchNextPage():query.refetch();
 const refresh=async()=>{setRefreshing(true);try{await Promise.all([query.refetch(),unread.refetch()]);}finally{setRefreshing(false);}};
 return {router,filter,setFilter,rides:pages.flatMap(page=>page.content),total:pages[0]?.totalElements ?? 0,page:pages.at(-1)?.page ?? 0,hasNext:query.hasNextPage,loading:query.isLoading,loadingMore:query.isFetchingNextPage,refreshing,refresh,error:query.error?.message ?? '',unreadCount:unread.data ?? 0,load};
}
