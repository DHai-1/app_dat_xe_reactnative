import type { RideCoordinates } from '@datxe/shared';
export type BookingPlace = { id: string; name: string; address: string; coordinate: RideCoordinates; provider?: 'goong'; secondaryAddress?: string | null };
export type PlaceSuggestion = Omit<BookingPlace, 'coordinate'> & { coordinate?: RideCoordinates | null };
export type PlaceSearchResult = { provider: 'goong'; limitedCoverage: boolean; places: PlaceSuggestion[] };
export type PlaceKind = 'pickup' | 'dropoff';
export type BookingMapProps = {
  center: RideCoordinates;
  pickup?: BookingPlace | null;
  dropoff?: BookingPlace | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
};
