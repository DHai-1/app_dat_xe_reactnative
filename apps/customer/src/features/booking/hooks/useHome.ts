import { translate as i18nT } from '@datxe/shared';
import { getCustomerDisplayName } from '@/lib/customerName';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { RideCoordinates } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useFocusEffect,useRouter } from 'expo-router';
import { useCallback,useRef,useState } from 'react';
import {
Linking
} from 'react-native';
import { getActiveCustomerRide,getCustomerProfile,getCustomerRides,getCustomerVouchers,getNearbyCustomerDrivers,getUnreadNotificationCount } from '../api';
import { getRecentDestinations } from '../components/HomeScreenParts';
let cachedLocation: { coordinate: RideCoordinates; label: string; updatedAt: number } | null = null;
export function useHome() {
const router = useRouter();
const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
const [currentLocation, setCurrentLocation] = useState(cachedLocation?.label ?? 'Đang xác định vị trí…');
const [currentCoordinates, setCurrentCoordinates] = useState<RideCoordinates | null>(cachedLocation?.coordinate ?? null);
const [locationLoading, setLocationLoading] = useState(!cachedLocation);
const locationPermissionRequested = useRef(false);
const locationBusy = useRef(false);
const refreshLocation = useCallback(async (requestPermission = false) => {
    if (locationBusy.current || (!requestPermission && cachedLocation && Date.now() - cachedLocation.updatedAt < 30000)) return;
    locationBusy.current = true;
    setLocationLoading(!cachedLocation);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain && (requestPermission || !locationPermissionRequested.current)) {
        locationPermissionRequested.current = true;
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        cachedLocation = null;
        setCurrentCoordinates(null);
        if (requestPermission && !permission.canAskAgain) await Linking.openSettings();
        setCurrentLocation(permission.canAskAgain
          ? i18nT("Cho phép vị trí để xem khu vực hiện tại")
          : i18nT("Bật quyền vị trí trong cài đặt"));
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinate = { lat: position.coords.latitude, lng: position.coords.longitude };
      if (cachedLocation && Math.hypot((coordinate.lat - cachedLocation.coordinate.lat) * 111320, (coordinate.lng - cachedLocation.coordinate.lng) * 111320 * Math.cos(coordinate.lat * Math.PI / 180)) < 20) {
        cachedLocation.updatedAt = Date.now();
        return;
      }
      setCurrentCoordinates(coordinate);
      const places = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
      const place = places[0];
      const placeParts = [place?.district, place?.city ?? place?.subregion, place?.region]
        .filter((part): part is string => Boolean(part?.trim()));
      const uniquePlaceParts = [...new Set(placeParts)];
      const label = (
        uniquePlaceParts.slice(0, 2).join(', ')
          || place?.name
          || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
      );
      cachedLocation = { coordinate, label, updatedAt: Date.now() };
      setCurrentLocation(label);
    } catch {
      if (!cachedLocation) setCurrentLocation(i18nT("Chưa xác định được vị trí"));
    } finally {
      locationBusy.current = false;
      setLocationLoading(false);
    }
  }, []);
const profileQuery=useQuery({queryKey:['customer','getCustomerProfile'],queryFn:getCustomerProfile,staleTime:300000});
const activeQuery=useQuery({queryKey:['customer','getActiveCustomerRide'],queryFn:getActiveCustomerRide});
const voucherQuery=useQuery({queryKey:['customer','getCustomerVouchers'],queryFn:getCustomerVouchers,staleTime:120000});
const unreadQuery=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
const historyQuery=useQuery({queryKey:['customer','getCustomerRides','recent'],queryFn:()=>getCustomerRides(0,12)});
const nearbyQuery=useQuery({queryKey:['customer','getNearbyCustomerDrivers',currentCoordinates],queryFn:()=>getNearbyCustomerDrivers(currentCoordinates!),enabled:Boolean(currentCoordinates),refetchInterval:30000});
useRefreshOnFocus(activeQuery.refetch);
useFocusEffect(useCallback(()=>{void refreshLocation();const timer=setInterval(()=>{setCurrentHour(new Date().getHours());void refreshLocation();},30000);return()=>clearInterval(timer);},[refreshLocation]));
const profile=profileQuery.data;
const activeRide=activeQuery.data;
const vouchers=voucherQuery.data ?? [];
const unreadCount=unreadQuery.data ?? 0;
const recentDestinations=getRecentDestinations(historyQuery.data?.content ?? []);
const nearbyDrivers=nearbyQuery.data ?? [];
const loading=[profileQuery,activeQuery,voucherQuery,unreadQuery].some(query=>query.isLoading);
const loadError=[profileQuery,activeQuery,voucherQuery,unreadQuery].find(query=>query.error)?.error?.message ?? '';
const customerName = getCustomerDisplayName(profile?.full_name) || 'bạn';
const greetingName = customerName === 'bạn'
    ? i18nT('bạn')
    : customerName.split(/\s+/).pop() || customerName;
const activeVoucher = vouchers[0];
const openBooking = (destination?: string) => {
    if (activeRide) {
      router.push({ pathname: '/ride/tracking', params: { rideId: String(activeRide.id) } });
      return;
    }
    router.push({ pathname: '/ride/route-selection', params: {
      ...(destination ? { destination } : {}),
      ...(currentCoordinates && !locationLoading ? { pickupLat: String(currentCoordinates.lat), pickupLng: String(currentCoordinates.lng), pickupAddress: currentLocation } : {}),
    } });
  };
return { router, profile, activeRide, recentDestinations, unreadCount, loading, loadError, currentHour, currentLocation, currentCoordinates, nearbyDrivers, locationLoading, refreshLocation, greetingName, activeVoucher, openBooking };
}
