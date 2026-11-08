import { ProgressBar } from "react-native-paper";
import { DriverPage } from "@/components/DriverPage";
import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { useSessionStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { CustomerRideDetail } from "@datxe/shared";
import { cancelDriverRide } from "../api";
import { rideStyles as s } from "@/components/rideStyles";
import { RideCustomerCard } from "../components/RideCustomerCard";
import { StatusBadge } from "@/components/StatusBadge";
import { openExternalDirections } from "@/lib/navigation";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  PaperTextInput as TextInput,
  Typography as Text,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";

import { useInProgress } from "../hooks/useInProgress";
const cancellableStatuses = new Set(["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "DRIVER_ARRIVED", "VEHICLE_HANDOVER"]);

const phases: Partial<Record<CustomerRideDetail["status"], [number, string]>> = {
  DRIVER_ASSIGNED: [1, "Chuẩn bị đến đón"], DRIVER_ARRIVING: [1, "Đến điểm đón"],
  DRIVER_ARRIVED: [2, "Lập biên bản nhận xe"], VEHICLE_HANDOVER: [2, "Xác nhận nhận xe"],
  IN_PROGRESS: [3, "Di chuyển tới điểm trả"], ARRIVED_DESTINATION: [4, "Lập biên bản trả xe"],
  VEHICLE_RETURNED: [4, "Xác nhận trả xe"],
};

export default function InProgressRideScreen() {
  const themed_s = useThemedStyles(s);
  const colors = useThemeColors();

  const {
    router,
    query,
    ride,
    action,
    progress,
    isDropoff,
    waitingForCustomer,
  } = useInProgress();
  const client = useQueryClient();
  const [confirmation, setConfirmation] = useState<{ rideId: number; userId: number } | null>(null);
  const [reason, setReason] = useState("");
  const canCancel = Boolean(ride && cancellableStatuses.has(ride.status));
  const cancel = useMutation({
    mutationFn: async ({ rideId, userId, reason }: { rideId: number; userId: number; reason: string }) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      const current = client.getQueryData<CustomerRideDetail | null>(["driver", "activeRide"]);
      if (current?.id !== rideId || !cancellableStatuses.has(current.status)) throw new Error("Chuyến đã đổi trạng thái và không thể hủy.");
      return cancelDriverRide(rideId, reason);
    },
    onSuccess: (_, { rideId, userId }) => {
      const store = useSessionStore.getState();
      if (store.user?.id !== userId) return;
      client.setQueryData<CustomerRideDetail | null>(["driver", "activeRide"], (previous) => previous?.id === rideId ? null : previous);
      if (store.activeRide?.id === rideId) store.setActiveRide(null);
      void client.invalidateQueries({ queryKey: ["driver"] });
      setConfirmation(null);
      router.replace("/(tabs)/home");
    },
    onError: () => { void query.refetch(); },
  });
  const phase = ride ? phases[ride.status] : undefined;
  const inspection = () => router.push("/ride/vehicle-inspection");
  const needsInspection = ride?.status === "DRIVER_ARRIVED" || ride?.status === "ARRIVED_DESTINATION";
  return (
    <DriverPage title="Chuyến đang thực hiện" loading={query.isLoading}
      error={query.error?.message || progress.error?.message}
      retry={query.error ? query.refetch : undefined}
      footer={ride && (action || needsInspection) ? (
        <Button
          label={needsInspection ? (isDropoff ? "Lập biên bản trả xe" : "Lập biên bản nhận xe") : action?.[0] ?? ""}
          loading={progress.isPending}
          loadingLabel="Đang cập nhật…"
          disabled={cancel.isPending}
          onPress={needsInspection ? inspection : () => progress.mutate()}
        />
      ) : undefined}
    >
        {ride ? (
          <>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>Chuyến #{ride.id}</Text>
              <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
              {phase ? (
                <>
                  <Text style={themed_s.text}>Bước {phase[0]}/4 · {phase[1]}</Text>
                  <ProgressBar progress={phase[0] / 4} accessibilityLabel={`Bước ${phase[0]} trên 4`} />
                </>
              ) : null}
              {waitingForCustomer ? (
                <>
                  <Text style={themed_s.text}>Khách cần kiểm tra và xác nhận biên bản trước khi bạn tiếp tục.</Text>
                  <Button variant="secondary" label="Xem biên bản đang chờ" onPress={inspection} />
                </>
              ) : null}
            </Card>
            <RideCustomerCard key={ride.id} ride={ride} />
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>ĐIỂM ĐÓN</Text>
              <Text style={themed_s.text}>{ride.pickupAddress}</Text>
              <Text style={themed_s.label}>GHI CHÚ ĐIỂM ĐÓN</Text>
              <Text style={themed_s.text}>
                {ride.pickupNote || "Khách chưa thêm ghi chú điểm đón."}
              </Text>
            </Card>
            <Card style={themed_s.card}>
              <Text style={themed_s.label}>ĐIỂM TRẢ</Text>
              <Text style={themed_s.text}>{ride.dropoffAddress}</Text>
              {ride.route ? (
                <Text style={themed_s.text}>
                  {(ride.route.distanceMeters / 1000).toFixed(2)} km ·{" "}
                  {Math.ceil(ride.route.durationSeconds / 60)} phút
                </Text>
              ) : null}
              <Text style={themed_s.title}>
                {formatMoney(ride.estimatedFare)}
              </Text>
            </Card>
            <Button
              variant="secondary"
              icon="directions"
              iconPosition="leading"
              onPress={() => void openExternalDirections(isDropoff ? ride.dropoff : ride.pickup)}
              label={isDropoff ? "Mở chỉ đường tới điểm trả" : "Mở chỉ đường tới điểm đón"}
            />
            {!needsInspection && !waitingForCustomer ? <Button variant="ghost" label="Xem biên bản bàn giao / hoàn trả" onPress={inspection} /> : null}
            <Button variant="ghost" label="Làm mới trạng thái chuyến" onPress={() => void query.refetch()} />
            <Button variant="ghost" label="Trợ giúp về chuyến này" icon="help-outline" iconPosition="leading"
              onPress={() => router.push({ pathname: "/support", params: { rideId: String(ride.id) } } as never)} />
            {canCancel ? <Button variant="ghost" icon="cancel" iconPosition="leading" label="Hủy chuyến"
              disabled={progress.isPending || cancel.isPending}
              onPress={() => {
                const userId = useSessionStore.getState().user?.id;
                if (!userId) return;
                cancel.reset();
                setReason("");
                setConfirmation({ rideId: ride.id, userId });
              }} /> : null}
          </>
        ) : !query.isLoading ? (
          <Card style={themed_s.card}>
            <Text>Bạn chưa có chuyến đang hoạt động.</Text>
            <Button variant="secondary" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} />
          </Card>
        ) : null}
      <DriverConfirmationDialog visible={Boolean(confirmation)} busy={cancel.isPending}
        title="Hủy chuyến đã nhận?"
        description="Khách sẽ được thông báo. Nếu còn lượt tìm lại trước khi tới điểm đón, hệ thống sẽ tìm tài xế khác."
        confirmLabel="Xác nhận hủy chuyến" dismissLabel="Tiếp tục chuyến"
        disabled={!reason.trim() || !canCancel || ride?.id !== confirmation?.rideId}
        error={cancel.error?.message}
        onDismiss={() => setConfirmation(null)}
        onConfirm={() => { if (confirmation) cancel.mutate({ ...confirmation, reason: reason.trim() }); }}>
        <TextInput label="Lý do hủy" mode="flat" underlineColor={colors.transparent} multiline
          maxLength={255} draftValue={reason} onChangeText={setReason} editable={!cancel.isPending} />
        <Text style={themed_s.label}>{reason.length}/255 ký tự</Text>
      </DriverConfirmationDialog>
    </DriverPage>
  );
}
