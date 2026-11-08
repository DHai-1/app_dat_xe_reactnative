import type { CustomerRideDetail } from "@datxe/shared";
export const CHAT_OPEN_STATUSES = new Set<CustomerRideDetail["status"]>([
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
]);

export function canChat(ride: CustomerRideDetail | null): boolean {
  return Boolean(ride?.driverId && CHAT_OPEN_STATUSES.has(ride.status));
}

export function makeUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
    },
  );
}
