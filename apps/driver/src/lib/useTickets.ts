import { createTicketApi, type CreateTicketInput, type SendTicketMessageInput, type TicketDetail, type TicketMessage } from '@datxe/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from './api';
import { useSessionStore } from './store';
import { useRefreshOnFocus } from './useRefreshOnFocus';

const api = createTicketApi(request);
const listKey = (userId?: number) => ['driver', 'tickets', userId] as const;
const detailKey = (userId: number | undefined, id: number) => ['driver', 'ticketDetail', userId, id] as const;
const messagesKey = (userId: number | undefined, id: number) => ['driver', 'ticketMessages', userId, id] as const;

export function useTickets() {
  const userId = useSessionStore(state => state.user?.id);
  const query = useInfiniteQuery({
    queryKey: listKey(userId),
    initialPageParam: 0,
    enabled: Boolean(userId),
    queryFn: ({ pageParam }) => api.list(pageParam),
    getNextPageParam: (last, pages) => last.length === 20 ? pages.length : undefined,
    refetchInterval: 15000,
  });
  useRefreshOnFocus(query.refetch);
  return {
    items: Array.from(new Map((query.data?.pages.flat() ?? []).map(item => [item.id, item])).values()),
    loading: query.isLoading,
    refreshing: query.isRefetching,
    error: query.error?.message,
    refresh: () => query.refetch(),
  };
}

export function useTicketDetail(id: number, enabled: boolean) {
  const userId = useSessionStore(state => state.user?.id);
  return useQuery({
    queryKey: detailKey(userId, id),
    enabled: enabled && Boolean(userId),
    queryFn: () => api.detail(id),
    refetchInterval: 15000,
  });
}

export function useTicketMessages(id: number, enabled: boolean) {
  const userId = useSessionStore(state => state.user?.id);
  return useQuery({
    queryKey: messagesKey(userId, id),
    enabled: enabled && Boolean(userId),
    queryFn: () => api.messages(id),
    // FCM là kênh chính; polling nhẹ là fallback khi push không tới.
    refetchInterval: 15000,
  });
}

export function useCreateTicket() {
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  return useMutation({
    mutationFn: (input: CreateTicketInput) => api.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: ['driver', 'tickets', userId] }),
  });
}

export function useSendTicketMessage(id: number) {
  const client = useQueryClient();
  const userId = useSessionStore(state => state.user?.id);
  return useMutation({
    mutationFn: (input: SendTicketMessageInput) => api.sendMessage(id, input),
    onSuccess: (message: TicketMessage) => {
      client.setQueryData<TicketMessage[]>(messagesKey(userId, id), current => {
        if (!current) return [message];
        if (current.some(item => item.id === message.id)) return current;
        return [...current, message];
      });
      client.setQueryData<TicketDetail>(detailKey(userId, id), current =>
        current ? { ...current, messages: [...current.messages.filter(item => item.id !== message.id), message] } : current);
      void client.invalidateQueries({ queryKey: ['driver', 'tickets', userId] });
    },
  });
}
