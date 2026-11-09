import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { request } from './api';

type OfferStop = { lat: number; lng: number; address: string };

export type DriverOffer = {
  rideId: number;
  offerId: string;
  expiresAt: number;
  serverTime: number;
  clientExpiresAt: number;
  pickup: OfferStop;
  dropoff: OfferStop;
  pickupNote?: string | null;
  note?: string | null;
  distanceToPickupKm?: number | null;
  etaToPickupMin?: number | null;
  tripDistanceKm: number;
  estDurationMin: number;
  fareEstimate: number;
  driverEarning: number;
  customer: { displayName: string };
  vehicle: { type: string; transmission: string };
};

export const getPendingOffer = (signal?: AbortSignal) => request<DriverOffer>('/driver/offers/pending', { allowNull: true, signal, timeoutMs: 5000 });

export const pendingOfferKey = ['driver', 'pendingOffer'] as const;

export function usePendingOffer(enabled = true, poll = false) {
  const driverId = useSessionStore(state => state.user?.id);
  return useQuery({
    queryKey: [...pendingOfferKey, driverId],
    queryFn: ({ signal }) => getPendingOffer(signal),
    enabled: enabled && Boolean(driverId),
    staleTime: 0,
    refetchInterval: poll ? 3000 : false,
  });
}
