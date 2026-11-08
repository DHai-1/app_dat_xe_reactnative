import { translate as i18nT } from '@datxe/shared';
import { useSettings } from '@/lib/settings/SettingsProvider';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { getCustomerRides, resolveBookingPlace, searchBookingPlaces } from '../api';
import { useBookingDraft } from '../store';
import type { PlaceSuggestion, PlaceKind } from '../types';
import { useDebouncedTextChange } from '@datxe/ui';
import { useDeviceLocation } from './useDeviceLocation';
import { useSearchProximity } from './useSearchProximity';

export function usePlaceSelection(kind: PlaceKind) {
  const router = useRouter();
  const {data:settings}=useSettings();
  const params = useLocalSearchParams<{ edit?: string }>();
  const edit = params.edit === '1';
  const draft = useBookingDraft();
  const [initialText] = useState(() => kind === 'dropoff' ? draft.destinationHint : '');
  const [text, setText] = useState(initialText);
  const normalizedText = text.trim().replace(/\s+/g, ' ').toLowerCase();
  const proximity = useSearchProximity(draft.pickup?.coordinate);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState('');
  const selecting = useRef(false);
  const selectionRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { selectionRequest.current?.abort(); }, []);
  const input = useDebouncedTextChange((value) => {
    setText(value);
    setSelectionError('');
  });
  const clearText = () => {
    input.cancel();
    setText('');
    setSelectionError('');
  };
  const canSearch = normalizedText.length >= 2;
  const search = useQuery({
    queryKey: ['customer', 'placeSearchV3', normalizedText, proximity?.lat, proximity?.lng],
    queryFn: ({ signal }) => searchBookingPlaces(normalizedText, proximity, signal),
    enabled: canSearch,
    retry: false,
    // Giữ kết quả cũ khi gõ tiếp (danh sách không nhấp nháy) và cache 5 phút để
    // gõ đi gõ lại cùng một địa chỉ không gọi lại API.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const recent = useQuery({ queryKey: ['customer', 'bookingRecentPlaces'], queryFn: () => getCustomerRides(0, 10), staleTime: 60000 });
  const recentAddresses = [...new Set(recent.data?.content.flatMap(ride => (kind === 'pickup' ? ride.pickupAddress : ride.dropoffAddress) || []).filter(Boolean) ?? [])].slice(0, 4);
  const device = useDeviceLocation();
  const select = async (suggestion: PlaceSuggestion) => {
    if (selecting.current) return;
    selecting.current = true; setSelectingId(suggestion.id); setSelectionError('');
    const controller = new AbortController();
    selectionRequest.current = controller;
    try {
      const place = await resolveBookingPlace(suggestion, controller.signal);
      if (controller.signal.aborted) return;
      Keyboard.dismiss(); draft.setPlace(kind, place);
      if (edit) router.dismissTo('/ride/confirm');
      else router.push(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
    } catch (error) { if (!controller.signal.aborted) setSelectionError(error instanceof Error ? error.message : i18nT("Chưa chọn được địa điểm. Vui lòng thử lại.")); }
    finally { selecting.current = false; setSelectingId(null); }
  };
  const useCurrentLocation = async () => { if (selecting.current) return; const place = await device.locate(); if (place) await select(place); };
  const openMap = () => { if (selecting.current) return; Keyboard.dismiss(); router.push({ pathname: '/ride/map-picker', params: { kind, edit: edit ? '1' : '0' } }); };
  return { savedPlaces:settings.places.map(p=>({id:p.id,name:p.name,address:p.address,coordinate:{lat:p.lat,lng:p.lng}})), router, text, initialText, onChangeText: input.onChangeText, clearText, selected: draft[kind], pickup: draft.pickup, results: canSearch ? search.data?.places ?? [] : [], limitedCoverage: canSearch && search.data?.limitedCoverage, provider: canSearch ? search.data?.provider : undefined, loading: canSearch && search.isFetching, error: selectionError || (canSearch ? search.error?.message : ''), selectingId, recentAddresses, select, openMap, useCurrentLocation, ...device };
}
