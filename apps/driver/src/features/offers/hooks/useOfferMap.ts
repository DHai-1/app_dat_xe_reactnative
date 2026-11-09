import { request } from '@/lib/api';
import { getFreshDriverCoordinates } from '@/lib/backgroundLocation';
import type { DriverOffer } from '@/lib/driverOffer';
import { directionsQuery, validDirectionsPoint } from '@/lib/navigation';
import type { MapDirections, RideCoordinates } from '@datxe/shared';
import { mapBounds, type GoongMapMarker } from '@datxe/ui/goong-map';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type VehicleType = 'CAR' | 'MOTORCYCLE';

function useOfferLeg(origin: RideCoordinates | null, destination: RideCoordinates | null, vehicle: VehicleType | null, enabled: boolean) {
  return useQuery({
    queryKey: ['driver', 'offerDirections', origin?.lat, origin?.lng, destination?.lat, destination?.lng, vehicle],
    enabled: enabled && Boolean(origin && destination && vehicle),
    queryFn: ({ signal }) => {
      if (!origin || !destination || !vehicle) return null;
      return request<MapDirections>('/location/directions?' + directionsQuery(origin, destination, vehicle), {
        signal, timeoutMs: 5_000,
      });
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function geometry(directions: MapDirections | null | undefined) {
  const points = directions?.coordinates;
  return points && points.length > 1 && points.every(validDirectionsPoint) ? points : null;
}

export function useOfferMap(offer: DriverOffer, live: boolean) {
  const pickup = validDirectionsPoint(offer.pickup) ? offer.pickup : null;
  const dropoff = validDirectionsPoint(offer.dropoff) ? offer.dropoff : null;
  const origin = useQuery({
    queryKey: ['driver', 'offerMapOrigin', offer.offerId],
    queryFn: getFreshDriverCoordinates,
    enabled: live,
    refetchInterval: query => query.state.data ? false : 1_000,
    staleTime: Infinity,
  }).data ?? null;
  const type = offer.vehicle.type;
  const vehicle = type === 'CAR' || type === 'MOTORCYCLE' ? type : null;
  const approach = geometry(useOfferLeg(origin, pickup, vehicle, live).data);
  const trip = geometry(useOfferLeg(pickup, dropoff, vehicle, live).data);
  return useMemo(() => {
    const markers: GoongMapMarker[] = [];
    if (pickup) markers.push({ id: 'offer-pickup', kind: 'pickup', coordinate: pickup });
    if (dropoff) markers.push({ id: 'offer-dropoff', kind: 'dropoff', coordinate: dropoff });

    // Fall back to a labeled schematic for any leg whose road geometry is unavailable.
    const route = [
      ...(origin && pickup ? approach ?? [origin, pickup] : []),
      ...(pickup && dropoff ? trip ?? [pickup, dropoff] : []),
    ];
    return {
      center: pickup ?? dropoff ?? origin ?? { lat: 21.0285, lng: 105.8542 },
      currentLocation: origin,
      markers,
      route,
      bounds: mapBounds([...(origin ? [origin] : []), ...markers.map(marker => marker.coordinate), ...route]),
      approximate: Boolean((origin && pickup && !approach) || (pickup && dropoff && !trip)),
    };
  }, [approach, dropoff, origin, pickup, trip]);
}
