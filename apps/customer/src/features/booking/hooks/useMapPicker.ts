import type { RideCoordinates } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reverseBookingPlace } from '../api';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';
import { useBookingDraft } from '../store';
import { useDeviceLocation } from './useDeviceLocation';

export function useMapPicker() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; edit?: string }>();
  const kind = params.kind === 'dropoff' ? 'dropoff' : 'pickup';
  const draft = useBookingDraft();
  const [center, setCenter] = useState(draft[kind]?.coordinate ?? draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER);
  const [point, setPoint] = useState<RideCoordinates | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapMoving, updateMapMoving] = useState(false);
  const pointKey = point ? `${point.lat.toFixed(5)},${point.lng.toFixed(5)}` : '';
  const [selection, setSelection] = useState<{ key: string; point: RideCoordinates } | null>(null);
  useEffect(() => {
    if (mapMoving || !point || !mapReady) return;
    // Chờ bản đồ dừng hẳn rồi mới geocode: 1 lần gọi Goong cho mỗi lần thả tay.
    const timer = setTimeout(() => setSelection(previous => previous?.key === pointKey ? previous : { key: pointKey, point }), 450);
    return () => clearTimeout(timer);
  }, [mapMoving, point, pointKey, mapReady]);
  // Tự thoát trạng thái "đang di chuyển" nếu Mapbox không bắn onMapIdle,
  // để màn ghim không kẹt ở "Đang xác định địa chỉ…".
  const movingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMapMoving = useCallback((value: boolean) => {
    if (movingTimer.current) clearTimeout(movingTimer.current);
    if (!value) {
      updateMapMoving(false);
      return;
    }
    updateMapMoving(true);
    movingTimer.current = setTimeout(() => updateMapMoving(false), 900);
  }, []);
  useEffect(() => () => {
    if (movingTimer.current) clearTimeout(movingTimer.current);
  }, []);
  const moving = !selection || pointKey !== selection.key;
  const query = useQuery({
    queryKey: ['map-picker-address', selection?.key],
    queryFn: ({ signal }) => reverseBookingPlace(selection!.point, signal),
    enabled: Boolean(selection), staleTime: Infinity, gcTime: 300_000,
    retry: false, retryOnMount: false, refetchOnMount: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const device = useDeviceLocation();
  const recenter = async () => { const place = await device.locate(); if (place) setCenter(place.coordinate); };
  const movePin = useCallback((next: RideCoordinates) => setPoint(previous => previous && Math.abs(previous.lat - next.lat) < 0.000005 && Math.abs(previous.lng - next.lng) < 0.000005 ? previous : next), []);
  const canConfirm = mapReady && !mapMoving && !device.locating && !moving && !query.isFetching && Boolean(query.data) && !query.isError;
  const confirm = () => {
    if (!canConfirm || !query.data || !point) return;
    draft.setPlace(kind, { ...query.data, coordinate: point });
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.replace(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
  };
  return { router, kind, center, movePin, setMapReady, setMapMoving, mapReady, place: moving || mapMoving ? null : query.data, resolving: mapMoving || moving || query.isFetching, error: query.error?.message ?? device.locationError, canConfirm, confirm, recenter, locating: device.locating };
}
