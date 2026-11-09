import type { RequestOptions } from './client';
import type { CreateTicketInput, SendTicketMessageInput, TicketDetail, TicketMessage, TicketStatus, TicketSummary } from '../types/ticket';

type TicketRequest = <T>(path: string, options?: RequestOptions) => Promise<T | null>;

export async function requireTicketData<T>(result: Promise<T | null>): Promise<T> {
  const data = await result;
  if (data == null) throw new Error('Chưa tải được dữ liệu hỗ trợ. Vui lòng thử lại.');
  return data;
}

export function createTicketApi(request: TicketRequest) {
  return {
    list: (page = 0, status?: TicketStatus) => requireTicketData(request<TicketSummary[]>(
      '/tickets?' + new URLSearchParams({ page: String(page), ...(status ? { status } : {}) }),
    )),
    create: (body: CreateTicketInput) => requireTicketData(request<TicketSummary>('/tickets', { method: 'POST', body })),
    detail: (id: number) => requireTicketData(request<TicketDetail>(`/tickets/${id}`)),
    messages: (id: number) => requireTicketData(request<TicketMessage[]>(`/tickets/${id}/messages`)),
    sendMessage: (id: number, body: SendTicketMessageInput) =>
      requireTicketData(request<TicketMessage>(`/tickets/${id}/messages`, { method: 'POST', body })),
  };
}
