import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSupportApi, requireSupportData, type SupportDraft, type SupportRide, type SupportStatusFilter } from '@datxe/shared';
import { useState } from 'react';
import { useSessionStore } from './store';
import { request } from './api';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export function useSupportRequests() {
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  const [ticketStatus, setTicketStatus] = useState<SupportStatusFilter>('all');
  const api = createSupportApi(request);
  const tickets = useInfiniteQuery({
    queryKey: ['driver', 'support', userId, ticketStatus], initialPageParam: 0, enabled: Boolean(userId),
    queryFn: ({ pageParam }) => api.list(pageParam, ticketStatus),
    getNextPageParam: (last, pages) => last.length === 20 ? pages.length : undefined,
    refetchInterval: 30000,
  });
  const rides = useInfiniteQuery({
    queryKey: ['driver', 'supportRides', userId], initialPageParam: 0, enabled: Boolean(userId),
    queryFn: ({ pageParam }) => requireSupportData(request<{ content: SupportRide[]; hasNext: boolean }>(`/driver/rides?page=${pageParam}&size=20`)),
    getNextPageParam: (last, pages) => last.hasNext ? pages.length : undefined,
  });
  const active = useQuery({ queryKey: ['driver', 'supportActiveRide', userId], enabled: Boolean(userId), queryFn: () => request<SupportRide>('/driver/rides/active', { allowNull: true }) });
  useRefreshOnFocus(tickets.refetch);
  useRefreshOnFocus(rides.refetch);
  useRefreshOnFocus(active.refetch);
  const send = useMutation({
    mutationFn: async (body: SupportDraft) => {
      if (!userId || useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
      return api.create(body);
    },
    retry: false,
    onSuccess: () => useSessionStore.getState().user?.id === userId ? client.invalidateQueries({ queryKey: ['driver', 'support'] }) : undefined,
  });
  const allRides = [...(active.data ? [active.data] : []), ...(rides.data?.pages.flatMap(page => page.content) ?? [])];
  return {
    ticketStatus, onTicketStatusChange: setTicketStatus,
    tickets: Array.from(new Map((tickets.data?.pages.flat() ?? []).map(ticket => [ticket.id, ticket])).values()), rides: allRides.filter((ride, index) => allRides.findIndex(item => item.id === ride.id) === index),
    loading: tickets.isLoading || rides.isLoading,
    pending: send.isPending,
    error: tickets.error?.message || rides.error?.message || active.error?.message,
    retry: () => Promise.allSettled([tickets.refetch(), rides.refetch(), active.refetch()]),
    send: send.mutateAsync,
    loadMoreTickets: tickets.hasNextPage && !tickets.isFetchingNextPage ? () => { void tickets.fetchNextPage(); } : undefined,
    loadMoreRides: rides.hasNextPage && !rides.isFetchingNextPage ? () => { void rides.fetchNextPage(); } : undefined,
  };
}
