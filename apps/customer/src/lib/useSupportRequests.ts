import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupportDraft, SupportRide, SupportTicket } from '@datxe/shared';
import { request } from './api';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export function useSupportRequests() {
  const client = useQueryClient();
  const tickets = useInfiniteQuery({
    queryKey: ['customer', 'support'], initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await request<SupportTicket[]>(`/support/tickets?page=${pageParam}`))!,
    getNextPageParam: (last, pages) => last.length === 20 ? pages.length : undefined,
    refetchInterval: 30000,
  });
  const rides = useInfiniteQuery({
    queryKey: ['customer', 'supportRides'], initialPageParam: 0,
    queryFn: async ({ pageParam }) => (await request<{ content: SupportRide[]; hasNext: boolean }>(`/customer/rides?page=${pageParam}&size=20`))!,
    getNextPageParam: (last, pages) => last.hasNext ? pages.length : undefined,
  });
  const active = useQuery({ queryKey: ['customer', 'supportActiveRide'], queryFn: () => request<SupportRide>('/customer/rides/active', { allowNull: true }) });
  useRefreshOnFocus(tickets.refetch);
  const send = useMutation({
    mutationFn: async (body: SupportDraft) => (await request<SupportTicket>('/support/tickets', { method: 'POST', body }))!,
    onSuccess: () => client.invalidateQueries({ queryKey: ['customer', 'support'] }),
  });
  const allRides = [...(active.data ? [active.data] : []), ...(rides.data?.pages.flatMap(page => page.content) ?? [])];
  return {
    tickets: tickets.data?.pages.flat() ?? [], rides: allRides.filter((ride, index) => allRides.findIndex(item => item.id === ride.id) === index),
    loading: tickets.isLoading || rides.isLoading,
    pending: send.isPending,
    error: tickets.error?.message || rides.error?.message || active.error?.message,
    retry: () => Promise.allSettled([tickets.refetch(), rides.refetch(), active.refetch()]),
    send: send.mutateAsync,
    loadMoreTickets: tickets.hasNextPage && !tickets.isFetchingNextPage ? () => { void tickets.fetchNextPage(); } : undefined,
    loadMoreRides: rides.hasNextPage && !rides.isFetchingNextPage ? () => { void rides.fetchNextPage(); } : undefined,
  };
}
