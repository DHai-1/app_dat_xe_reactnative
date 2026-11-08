import type { RideStatus } from '../types';
export const TERMINAL_RIDE_STATUSES: readonly RideStatus[] = ['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM'];
export const ROLES = ['CUSTOMER', 'DRIVER', 'ADMIN'] as const;
