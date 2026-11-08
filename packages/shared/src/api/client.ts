import axios,{ AxiosError,type InternalAxiosRequestConfig } from 'axios';
import { AuthApiError,getFirebaseUser } from '../firebase/authService';
import type { Role } from '../types';
type Envelope<T> = { success: boolean; data?: T | null; error?: { code?: string; message?: string } };
type RetryConfig = InternalAxiosRequestConfig & { refreshed?: boolean };
export type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; allowNull?: boolean; headers?: Record<string,string>; signal?: AbortSignal; timeoutMs?: number };
export function createApiClient(baseURL: string, role: Role, onUnauthorized: () => void = () => {}) {
  const client = axios.create({ baseURL, timeout: 20000 });
  client.interceptors.request.use(async config => {
    const user = getFirebaseUser();
    if (!user) throw new AuthApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'NO_AUTH_USER');
    config.headers.Authorization = 'Bearer ' + await user.getIdToken();
    config.headers['X-Role'] = role;
    return config;
  });
  client.interceptors.response.use(response => response, async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && config && !config.refreshed) {
      config.refreshed = true;
      const user = getFirebaseUser();
      if (user) {
        try { await user.getIdToken(true); } catch { onUnauthorized(); throw new AuthApiError('Phiên đăng nhập đã hết hạn.', 'HTTP_401'); }
        return client.request(config);
      }
    }
    if (error.response?.status === 401) onUnauthorized();
    throw error;
  });
  return async function request<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    try {
      const response = await client.request<Envelope<T>>({ url, method: options.method ?? 'GET', data: options.body, headers: options.headers, signal: options.signal, timeout: options.timeoutMs });
      const envelope = response.data;
      if (!envelope || !envelope.success) throw new AuthApiError(envelope?.error?.message ?? 'Máy chủ trả về dữ liệu không hợp lệ.', envelope?.error?.code ?? 'INVALID_SERVER_RESPONSE');
      if (envelope.data == null && !options.allowNull) throw new AuthApiError('Máy chủ chưa trả về dữ liệu.', 'INVALID_SERVER_RESPONSE');
      return envelope.data ?? null;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      if (error instanceof AuthApiError) throw error;
      if (axios.isAxiosError<Envelope<T>>(error)) throw new AuthApiError(error.response?.data?.error?.message ?? (error.response ? 'Không thể thực hiện yêu cầu.' : 'Không kết nối được máy chủ.'), error.response?.data?.error?.code ?? (error.response ? 'HTTP_' + error.response.status : 'NETWORK_ERROR'));
      throw error;
    }
  };
}
