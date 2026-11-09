import type { RequestOptions } from './client';
export type WalletKind = 'CREDIT' | 'CASH' | 'CUSTOMER';
export type WalletBalance = { walletType: WalletKind; balance: number };
export type WalletOverview = { balances: WalletBalance[]; mockTopUpEnabled: boolean; maxTopUpAmount: number };
export type WalletEntry = { transactionId: number; userId: number; userType: 'DRIVER' | 'CUSTOMER'; walletType: WalletKind; amount: number; transactionType: 'TOP_UP' | 'WITHDRAW' | 'RIDE_PAYMENT' | 'COMMISSION_FEE' | 'REFUND'; status: 'PENDING' | 'SUCCESS' | 'FAILED'; referenceTripId: number | null; withdrawalId: number | null; balanceAfter: number | null; createdAt: string; description?: string | null };
export type WalletPage<T> = { content: T[]; number: number; size: number; totalElements: number; totalPages: number; last: boolean };
export type Withdrawal = { id: number; driverId: number; amount: number; status: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'FAILED'; createdAt: string; reviewedAt: string | null; reviewedBy: number | null; rejectReason: string | null };
type WalletRequest = <T>(path: string, options?: RequestOptions) => Promise<T | null>;
export async function requireWalletData<T>(result: Promise<T | null>): Promise<T> {
  const data = await result;
  if (data == null) throw new Error('Chưa tải được dữ liệu ví. Vui lòng thử lại.');
  return data;
}
export function createWalletApi(request: WalletRequest, role: 'customer' | 'driver') {
  return {
    overview: () => requireWalletData(request<WalletOverview>('/wallet/overview')),
    history: (page = 0, walletType?: WalletKind) => requireWalletData(request<WalletPage<WalletEntry>>('/wallet/transactions?' + new URLSearchParams({ page: String(page), ...(walletType ? { walletType } : {}) }))),
    topUp: (amount: number, key: string) => request<void>(`/${role}/wallet/top-up`, { method: 'POST', body: { amount }, headers: { 'Idempotency-Key': key } }),
  };
}
export function walletBalance(overview: WalletOverview | null | undefined, kind: WalletKind) {
  return overview?.balances.find(item => item.walletType === kind)?.balance;
}
export function parseWalletAmount(input: string, max = Number.MAX_SAFE_INTEGER): number | null {
  const value = Number(input);
  return /^\d+$/.test(input) && Number.isSafeInteger(value) && value > 0 && value <= max ? value : null;
}
export type WalletAttempt = { amount: number; key: string };
export function walletAttempt(previous: WalletAttempt | undefined, amount: number): WalletAttempt {
  return previous?.amount === amount ? previous : { amount, key: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
}
export type WalletAttemptStorage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>; removeItem: (key: string) => Promise<void> };
export async function readWalletAttempt(storage: WalletAttemptStorage, scope: string): Promise<WalletAttempt | undefined> {
  const raw = await storage.getItem(scope);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw);
    if (Number.isSafeInteger(value.amount) && value.amount > 0 && typeof value.key === 'string' && value.key.length > 0 && value.key.length <= 100) return value;
  } catch {}
  throw new Error('Không đọc được mã giao dịch trước. Vui lòng kiểm tra lịch sử trước khi thử lại.');
}
export async function persistWalletAttempt(storage: WalletAttemptStorage, scope: string, amount: number): Promise<WalletAttempt> {
  const attempt = walletAttempt(await readWalletAttempt(storage, scope), amount);
  await storage.setItem(scope, JSON.stringify(attempt));
  return attempt;
}
