import { env } from '@/config/env';
import type { NearbyDriverMarker, RideCoordinates } from '@datxe/shared';
import { GoongMap, useDeviceHeading, type GoongMapMarker, type MapViewportInsets } from '@datxe/ui/goong-map';
import { watchHeadingAsync } from 'expo-location';
import { useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { homeMapBounds } from './homeMapViewport';

const defaultCenter = { lat: 21.0285, lng: 105.8542 };

type Props = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  viewport?: MapViewportInsets;
  recenterToken?: number;
};

export function HomeMap({ coordinate, drivers, viewport, recenterToken = 0 }: Props) {
  const focused = useIsFocused();
  const heading = useDeviceHeading(focused && Boolean(coordinate), watchHeadingAsync);
  const [camera, setCamera] = useState({ coordinate, token: recenterToken });
  if (coordinate && (!camera.coordinate || camera.token !== recenterToken)) {
    setCamera({ coordinate, token: recenterToken });
  }
  const center = camera.coordinate ?? defaultCenter;
  const { sw, ne } = homeMapBounds(center);
  const markers = useMemo<GoongMapMarker[]>(() => drivers.map(({ location }, index) => ({
    id: `nearby-${index}`, coordinate: location, kind: 'nearby',
  })), [drivers]);
  return <GoongMap center={center} bounds={[...sw, ...ne]} cameraVersion={recenterToken}
    viewport={viewport} markers={markers} currentLocation={coordinate} currentHeading={heading} mapKey={env.goongMapKey} />;
}
