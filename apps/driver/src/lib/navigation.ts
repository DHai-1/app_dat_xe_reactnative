import type { CustomerRideDetail, RideCoordinates } from '@datxe/shared';
import { router } from 'expo-router';

export type RideStop = 'pickup' | 'dropoff';

export function validDirectionsPoint(point: { lat: number | null; lng: number | null }): point is RideCoordinates {
  return point.lat !== null && point.lng !== null &&
    Number.isFinite(point.lat) && Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}

export function directionsDestination(rideId: number, stop: RideStop) {
  return { pathname: '/ride/directions' as const, params: { rideId: String(rideId), stop } };
}

export function openRideDirections(ride: CustomerRideDetail, stop: RideStop) {
  if (validDirectionsPoint(ride[stop])) router.push(directionsDestination(ride.id, stop));
}

export function directionsQuery(origin: RideCoordinates, destination: RideCoordinates, vehicleType: 'CAR' | 'MOTORCYCLE') {
  return new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
    vehicleType,
  });
}
