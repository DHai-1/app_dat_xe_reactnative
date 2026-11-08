import { translate as i18nT } from '@datxe/shared';
import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import type { CreateCustomerRideRequest,CreateCustomerRideResponse,NearbyDriverMarker,RideCoordinates,RideEstimate,RideEstimateRequest } from '@datxe/shared';
import { isCoordinate } from './bookingUtils';
import type { BookingPlace, PlaceSuggestion, PlaceSearchResult } from './types';

export async function searchBookingPlaces(text: string, proximity?: RideCoordinates, signal?: AbortSignal): Promise<PlaceSearchResult> {
  const query = new URLSearchParams({ query: text.trim() });
  if (proximity) { query.set('proximityLat', String(proximity.lat)); query.set('proximityLng', String(proximity.lng)); }
  return (await request<PlaceSearchResult>(`/location/places/search?${query.toString()}`, { signal }))!;
}

export async function resolveBookingPlace(suggestion: PlaceSuggestion, signal?: AbortSignal): Promise<BookingPlace> {
  if (suggestion.coordinate && isCoordinate(suggestion.coordinate)) return { ...suggestion, coordinate: suggestion.coordinate };
  if (suggestion.provider !== 'goong') throw new Error(i18nT("Chưa có tọa độ chính xác. Hãy chọn vị trí trên bản đồ."));
  const query = new URLSearchParams({ id: suggestion.id });
  const place = (await request<PlaceSuggestion>(`/location/places/detail?${query.toString()}`, { signal }))!;
  if (!place.coordinate || !isCoordinate(place.coordinate)) throw new Error(i18nT("Chưa lấy được vị trí của địa chỉ này. Hãy thử lại hoặc chọn ghim trên bản đồ."));
  // Keep the exact suggestion address the user chose; details supplies verified coordinates.
  return { ...place, name: suggestion.name, address: suggestion.address, secondaryAddress: suggestion.secondaryAddress ?? place.secondaryAddress, coordinate: place.coordinate };
}

export async function reverseBookingPlace(point: RideCoordinates, signal?: AbortSignal): Promise<BookingPlace> {
  const query = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) });
  const place = (await request<BookingPlace>(`/location/places/reverse?${query.toString()}`, { signal }))!;
  // Preserve the exact pin, not the geocoder's snapped feature center.
  return { ...place, id: `pin:${point.lng},${point.lat}`, coordinate: point };
}

export { getBookingRoute } from '@/lib/directions';
export async function createCustomerRide(
  input: CreateCustomerRideRequest,
  idempotencyKey: string,
): Promise<CreateCustomerRideResponse> {
  return (await request<CreateCustomerRideResponse>('/customer/rides', {
    method: 'POST',
    body: input,
    headers: { 'Idempotency-Key': idempotencyKey },
  })) as CreateCustomerRideResponse;
}

export async function geocodeCustomerAddress(address: string): Promise<RideCoordinates | null> {
  const result = await searchBookingPlaces(address);
  return result.places[0] ? (await resolveBookingPlace(result.places[0])).coordinate : null;
}

export const getCustomerVouchers = customerApi.getCustomerVouchers;

export async function getRideEstimate(input: RideEstimateRequest): Promise<RideEstimate> {
  return (await request<RideEstimate>('/customer/rides/estimate', {
    method: 'POST',
    body: input,
  })) as RideEstimate;
}

export const cancelCustomerRide = customerApi.cancelCustomerRide;

export const getCustomerRide = customerApi.getCustomerRide;

export const getActiveCustomerRide = customerApi.getActiveCustomerRide;

export const getCustomerProfile = customerApi.getCustomerProfile;

export const getCustomerRides = customerApi.getCustomerRides;

export async function getNearbyCustomerDrivers(center: RideCoordinates): Promise<NearbyDriverMarker[]> {
  const query = new URLSearchParams({
    latitude: String(center.lat),
    longitude: String(center.lng),
  });
  return (await request<NearbyDriverMarker[]>(`/location/customer/nearby-drivers?${query.toString()}`)) as NearbyDriverMarker[];
}

export const getUnreadNotificationCount = customerApi.getUnreadNotificationCount;

export const getCustomerVehicles = customerApi.getCustomerVehicles;
