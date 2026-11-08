import { env } from '@/config/env';
import { GoongMap, mapBounds, type GoongMapMarker } from '@datxe/ui/goong-map';
import type { BookingMapProps } from './types';

export function BookingMap({ pickup, dropoff, driver, ...props }: BookingMapProps) {
  const markers: GoongMapMarker[] = [];
  if (pickup) markers.push({ id: 'pickup', coordinate: pickup.coordinate, kind: 'pickup' });
  if (dropoff) markers.push({ id: 'dropoff', coordinate: dropoff.coordinate, kind: 'dropoff' });
  if (driver) markers.push({ id: 'driver', coordinate: driver, kind: 'driver' });
  const bounds = pickup && dropoff
    ? mapBounds([pickup.coordinate, dropoff.coordinate, ...(props.route ?? [])])
    : undefined;
  return <GoongMap {...props} bounds={bounds} markers={markers} mapKey={env.goongMapKey} />;
}
