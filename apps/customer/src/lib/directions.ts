import { request } from '@/lib/api';
import type { RideCoordinates } from '@datxe/shared';

export async function getBookingRoute(
  pickup: RideCoordinates,
  dropoff: RideCoordinates,
  vehicleType: 'CAR' | 'MOTORCYCLE',
  signal?: AbortSignal,
): Promise<RideCoordinates[]> {
  const query = new URLSearchParams({
    origin: `${pickup.lng},${pickup.lat}`,
    destination: `${dropoff.lng},${dropoff.lat}`,
    vehicleType,
  });
  const result = await request<{ coordinates: RideCoordinates[] }>(`/location/directions?${query.toString()}`, { signal });
  return result?.coordinates ?? [];
}
