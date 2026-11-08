import { translate as t, type RideCoordinates } from '@datxe/shared';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { reverseBookingPlace } from '../api';

export function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setError] = useState('');
  const busy = useRef(false);

  async function locateWith<T>(resolve: (point: RideCoordinates) => Promise<T>): Promise<T | null> {
    if (busy.current) return null;
    busy.current = true;
    setLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error(t("Bạn chưa cho phép truy cập vị trí. Hãy tìm địa chỉ hoặc chọn trên bản đồ."));
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return await resolve({ lat: coords.latitude, lng: coords.longitude });
    } catch (error) {
      setError(error instanceof Error ? error.message : t("Chưa xác định được vị trí hiện tại."));
      return null;
    } finally {
      busy.current = false;
      setLocating(false);
    }
  }

  return {
    locate: () => locateWith(reverseBookingPlace),
    // The map picker resolves its address after camera idle through its debounce and cache.
    locateCoordinates: () => locateWith(async point => point),
    locating,
    locationError,
  };
}
