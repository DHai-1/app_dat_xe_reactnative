import type { RideCoordinates } from '@datxe/shared';
import type { MapViewportInsets } from "@datxe/ui/goong-map";
export type BookingMapProps = {
  center: RideCoordinates;
  cameraVersion?: number;
  viewport?: MapViewportInsets;
  pickup?: { coordinate: RideCoordinates } | null;
  dropoff?: { coordinate: RideCoordinates } | null;
  driver?: RideCoordinates | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  editablePin?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
};
