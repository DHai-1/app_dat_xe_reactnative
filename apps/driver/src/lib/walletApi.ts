import { createWalletApi, requireWalletData, type WalletPage, type Withdrawal } from '@datxe/shared';
import { request } from './api';
export const walletApi = createWalletApi(request, 'driver');
export const getWithdrawals = (page = 0) => requireWalletData(request<WalletPage<Withdrawal>>('/driver/withdrawals?page=' + page));
export const createWithdrawal = (amount: number, key: string) => requireWalletData(request<Withdrawal>('/driver/withdrawals', { method: 'POST', body: { amount, walletType: 'CASH' }, headers: { 'Idempotency-Key': key } }));

export const getWithdrawal = (id: number) => requireWalletData(request<Withdrawal>('/driver/withdrawals/' + id));
