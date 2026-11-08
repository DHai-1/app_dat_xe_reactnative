import type { RideCoordinates } from '@datxe/shared';

export type MapViewportInsets = { top: number; bottom: number };
export type MapBounds = [number, number, number, number];
export type GoongMapMarker = {
  id: string;
  coordinate: RideCoordinates;
  kind: 'nearby' | 'driver' | 'pickup' | 'dropoff';
};
export type GoongMapProps = {
  mapKey?: string;
  center: RideCoordinates;
  viewport?: MapViewportInsets;
  bounds?: MapBounds;
  cameraVersion?: number;
  markers?: GoongMapMarker[];
  currentLocation?: RideCoordinates | null;
  currentHeading?: number | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  editablePin?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
};
