import type { RequestOptions } from './client';
import type { SupportDraft, SupportStatusFilter, SupportTicket } from '../types/support';

type SupportRequest = <T>(path: string, options?: RequestOptions) => Promise<T | null>;
export async function requireSupportData<T>(result: Promise<T | null>): Promise<T> {
  const data = await result;
  if (data == null) throw new Error('Chưa tải được dữ liệu hỗ trợ. Vui lòng thử lại.');
  return data;
}
export function createSupportApi(request: SupportRequest) {
  return {
    list: (page: number, status: SupportStatusFilter = 'all') => requireSupportData(request<SupportTicket[]>(
      '/support/tickets?' + new URLSearchParams({ page: String(page), ...(status === 'all' ? {} : { status }) }),
    )),
    create: (body: SupportDraft) => requireSupportData(request<SupportTicket>('/support/tickets', { method: 'POST', body })),
  };
}
