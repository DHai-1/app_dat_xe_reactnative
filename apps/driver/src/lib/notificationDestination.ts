import { resolvePushDestination, type CustomerRideDetail, type PushEnvelope } from "@datxe/shared";
import { request } from "./api";
import { getPendingOffer } from "./driverOffer";
import { driverApi } from "./driverApi";

export const resolveDriverNotification = (event: PushEnvelope) => resolvePushDestination(event, "DRIVER", {
  ride: async (id) => {
    const ride = await driverApi.ride(id);
    if (!ride) throw new Error("Không tìm thấy chuyến.");
    return ride;
  },
  pendingOffer: getPendingOffer,
  activeRide: () => request<CustomerRideDetail>("/driver/rides/active", { allowNull: true }),
});
