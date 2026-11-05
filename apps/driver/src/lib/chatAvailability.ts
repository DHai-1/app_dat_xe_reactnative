import type { CustomerRideDetail } from '@datxe/shared';

const openStatuses = new Set([
  'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'VEHICLE_HANDOVER',
  'IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED',
]);

export function canDriverChat(ride: Pick<CustomerRideDetail, 'driverId' | 'status'> | null | undefined) {
  return Boolean(ride?.driverId && openStatuses.has(ride.status));
}
