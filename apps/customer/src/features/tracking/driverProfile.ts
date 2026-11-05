import type { CustomerRideDetail, CustomerRideDriver } from '@datxe/shared';

export function assignedDriver(ride: Pick<CustomerRideDetail, 'driverId' | 'driver'>): CustomerRideDriver | null {
  return ride.driverId && ride.driver?.id === ride.driverId ? ride.driver : null;
}

/** tel: opens the OS phone handler. Reject USSD, extensions and injected URL schemes. */
export function driverPhoneUrl(phone: string | null | undefined): string | null {
  if (!phone || !/^[+\d\s().-]+$/.test(phone)) return null;
  const normalized = phone.replace(/[\s().-]/g, '');
  return /^\+?\d{8,15}$/.test(normalized) ? `tel:${normalized}` : null;
}

export function driverRating(rating: number | null | undefined): number | null {
  return typeof rating === 'number' && Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export function driverExperience(years: number | null | undefined): number | null {
  return typeof years === 'number' && Number.isSafeInteger(years) && years >= 0 ? years : null;
}

export function driverInitials(name: string | null | undefined) {
  return name?.trim().split(/\s+/).slice(-2).map(part => part.charAt(0)).join('').toUpperCase() || '';
}
