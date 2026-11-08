import type { CustomerRideDetail } from "@datxe/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard } from "react-native";
import { customerApi } from "./customerApi";
import { useSessionStore } from "./store";

const cancellable = new Set<CustomerRideDetail["status"]>([
  "PENDING", "SEARCHING", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "DRIVER_ARRIVED", "VEHICLE_HANDOVER",
]);

export function useCustomerRideCancellation(
  ride: CustomerRideDetail | null | undefined,
  refresh: () => unknown,
  { cancelSearchingImmediately = false } = {},
) {
  const router = useRouter();
  const client = useQueryClient();
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const submitting = useRef(false);
  const canCancel = Boolean(ride && cancellable.has(ride.status));
  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => customerApi.cancelCustomerRide(id, reason),
    onSuccess: (_, { id }) => {
      const store = useSessionStore.getState();
      if (store.activeRide?.id === id) store.setActiveRide(null);
      setSelectedRideId(null);
      router.replace("/(tabs)/home");
      void client.invalidateQueries({ queryKey: ["customer"] });
    },
    onError: () => { void refresh(); },
    onSettled: () => { submitting.current = false; },
  });
  const open = () => {
    if (!ride || !canCancel || submitting.current) return;
    mutation.reset();
    if (cancelSearchingImmediately && ride.status === "SEARCHING") {
      submitting.current = true;
      mutation.mutate({ id: ride.id });
      return;
    }
    setReason("");
    setSelectedRideId(ride.id);
  };
  const dismiss = () => {
    if (!submitting.current) setSelectedRideId(null);
  };
  const canSubmit = canCancel && selectedRideId != null && ride?.id === selectedRideId
    && reason.trim().length > 0 && reason.length <= 255;
  const submit = () => {
    if (!canSubmit || selectedRideId == null || submitting.current) return;
    submitting.current = true;
    Keyboard.dismiss();
    mutation.mutate({ id: selectedRideId, reason: reason.trim() });
  };

  return {
    canCancel, canSubmit, open, dismiss, submit, reason, setReason,
    visible: selectedRideId != null,
    busy: mutation.isPending,
    error: mutation.error?.message,
  };
}
