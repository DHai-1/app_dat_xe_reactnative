import type { RideCoordinates } from '@datxe/shared';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reverseBookingPlace } from '../api';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';
import { MapPinResolver, type PinSelection } from '../mapPinResolver';
import { useBookingDraft } from '../store';
import type { BookingPlace } from '../types';
import { useDeviceLocation } from './useDeviceLocation';

const addressCache = new Map<string, BookingPlace>();

export function useMapPicker() {
  const router = useRouter();
  const focused = useIsFocused();
  const params = useLocalSearchParams<{ kind?: string; edit?: string }>();
  const kind = params.kind === 'dropoff' ? 'dropoff' : 'pickup';
  const draft = useBookingDraft();
  const [center, setCenter] = useState(draft[kind]?.coordinate ?? draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER);
  const [cameraVersion, setCameraVersion] = useState(0);
  const cameraMoving = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [selection, setSelection] = useState<PinSelection>({ phase: 'waiting', point: null, place: null, error: '' });
  const [resolver] = useState(() => new MapPinResolver(reverseBookingPlace, addressCache, setSelection));
  const idlePoint = useRef<RideCoordinates | null>(null);
  const enabled = useRef(false);
  const device = useDeviceLocation();

  useEffect(() => {
    enabled.current = focused && mapReady;
    if (enabled.current && !cameraMoving.current && idlePoint.current) resolver.idle(idlePoint.current);
    else resolver.cancel();
    return () => { enabled.current = false; resolver.cancel(); };
  }, [focused, mapReady, resolver]);

  const setMapMoving = useCallback((moving: boolean) => {
    cameraMoving.current = moving;
    if (moving) resolver.moving();
  }, [resolver]);
  // Map adapters emit center changes only when their camera has fully stopped.
  const movePin = useCallback((point: RideCoordinates) => {
    cameraMoving.current = false;
    idlePoint.current = point;
    if (enabled.current) resolver.idle(point);
  }, [resolver]);
  const recenter = async () => {
    resolver.moving();
    const point = await device.locateCoordinates();
    if (point && enabled.current) {
      setCenter(point);
      setCameraVersion(value => value + 1);
    } else if (enabled.current && !cameraMoving.current && idlePoint.current) resolver.idle(idlePoint.current);
  };
  const canConfirm = focused && mapReady && !device.locating && selection.phase === 'ready' && Boolean(selection.place);
  const confirm = () => {
    if (!canConfirm || !selection.place) return;
    draft.setPlace(kind, selection.place);
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.replace(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
  };
  return {
    router, kind, center, cameraVersion, movePin, setMapReady, setMapMoving, mapReady,
    mapMoving: selection.phase === 'moving',
    place: selection.phase === 'ready' ? selection.place : null,
    resolving: ['waiting', 'moving', 'debouncing', 'resolving'].includes(selection.phase),
    error: selection.error || device.locationError,
    retryable: selection.phase === 'error',
    retry: () => {
      if (enabled.current && !cameraMoving.current && idlePoint.current) {
        resolver.cancel();
        resolver.idle(idlePoint.current);
      }
    },
    canConfirm, confirm, recenter, locating: device.locating,
  };
}
