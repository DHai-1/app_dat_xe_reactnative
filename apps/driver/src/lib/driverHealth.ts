import { create } from 'zustand';

type Health = {
  connected: boolean; foregroundGranted: boolean | null; servicesEnabled: boolean | null;
  backgroundGranted: boolean | null; backgroundRunning: boolean; lastSampleAt: number | null;
  lastSentAt: number | null; error: string; retryVersion: number;
  update: (state: Partial<Omit<Health, 'update' | 'retry'>>) => void; retry: () => void;
};
export const useDriverHealth = create<Health>(set => ({
  connected: false, foregroundGranted: null, servicesEnabled: null, backgroundGranted: null,
  backgroundRunning: false, lastSampleAt: null, lastSentAt: null, error: '', retryVersion: 0,
  update: state => set(state), retry: () => set(state => ({ retryVersion: state.retryVersion + 1, error: '' })),
}));
