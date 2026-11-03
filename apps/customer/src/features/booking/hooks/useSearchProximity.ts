import type { RideCoordinates } from '@datxe/shared';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';

/** Làm tròn ~1km để queryKey ổn định (GPS nhích vài mét không tạo request mới). */
const quantize = (point: RideCoordinates): RideCoordinates => ({
  lat: Math.round(point.lat * 100) / 100,
  lng: Math.round(point.lng * 100) / 100,
});

export function useSearchProximity(selected?: RideCoordinates) {
  const [device, setDevice] = useState<RideCoordinates | null>(null);
  useEffect(() => {
    if (selected) return;
    let active = true;
    void (async () => {
      // Reuse existing permission; searching must not trigger a new permission dialog.
      if (!(await Location.getForegroundPermissionsAsync()).granted) return;
      const known = await Location.getLastKnownPositionAsync({ maxAge: 120000, requiredAccuracy: 200 });
      if (active && known) setDevice(quantize({ lat: known.coords.latitude, lng: known.coords.longitude }));
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setDevice(quantize({ lat: current.coords.latitude, lng: current.coords.longitude }));
    })().catch(() => { /* Hanoi remains available when GPS is off/unavailable. */ });
    return () => { active = false; };
  }, [selected]);
  return selected ? quantize(selected) : (device ?? DEFAULT_MAP_CENTER);
}
