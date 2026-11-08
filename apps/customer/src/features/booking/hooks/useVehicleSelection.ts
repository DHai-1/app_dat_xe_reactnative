import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getActiveCustomerRide, getBookingRoute, getCustomerVehicles } from '../api';
import { useBookingDraft } from '../store';
export function useVehicleSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const draft = useBookingDraft();
  const [selectedId, setSelectedId] = useState(draft.vehicleId);
  const vehicles = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles });
  const active = useQuery({ queryKey: ['customer', 'getActiveCustomerRide'], queryFn: getActiveCustomerRide, staleTime: 0 });
  useRefreshOnFocus(vehicles.refetch); useRefreshOnFocus(active.refetch);
  const selected = vehicles.data?.find(vehicle => vehicle.id === selectedId) ?? vehicles.data?.[0];
  const pickup = draft.pickup?.coordinate;
  const dropoff = draft.dropoff?.coordinate;
  const vehicleType = selected?.vehicle_type;
  const canPreview = Boolean(pickup && dropoff && (vehicleType === 'CAR' || vehicleType === 'MOTORCYCLE'));
  const preview = useQuery({
    queryKey: ['customer', 'bookingRoutePreview', pickup, dropoff, vehicleType],
    queryFn: ({ signal }) => {
      if (!pickup || !dropoff || (vehicleType !== 'CAR' && vehicleType !== 'MOTORCYCLE')) return [];
      return getBookingRoute(pickup, dropoff, vehicleType, signal);
    },
    enabled: canPreview,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const canContinue = Boolean(draft.pickup && draft.dropoff && selected && active.isSuccess && !active.isFetching && !active.data);
  const continueBooking = () => {
    if (!canContinue || !selected) return;
    draft.setVehicle(selected.id);
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.push('/ride/confirm');
  };
  return { router, draft, route: preview.data, vehicles: vehicles.data ?? [], loading: vehicles.isLoading, error: vehicles.error?.message ?? active.error?.message ?? '', refresh: () => { void vehicles.refetch(); void active.refetch(); }, activeRide: active.data, selected, setSelectedId, canContinue, continueBooking };
}
