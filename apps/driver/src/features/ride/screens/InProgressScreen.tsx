import { rideStyles as s } from "@/components/rideStyles";
import { DriverChatButton } from "@/components/DriverChatButton";
import { StatusBadge } from "@/components/StatusBadge";
import { openExternalDirections } from "@/lib/navigation";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { ActivityIndicator, ScrollView } from "react-native";

import { useInProgress } from "../hooks/useInProgress";
export default function InProgressRideScreen() {
  const themed_s = useThemedStyles(s);

  const {
    router,
    query,
    ride,
    action,
    progress,
    isDropoff,
    waitingForCustomer,
  } = useInProgress();
  return (
    <SafeAreaView style={themed_s.safe}>
      <ScrollView contentContainerStyle={themed_s.page}>
        <Pressable onPress={() => router.back()}>
          <Text style={themed_s.link}>‹ Quay lại</Text>
        </Pressable>
        <Text style={themed_s.title}>Chuyến đang thực hiện</Text>
        {query.isLoading ? <ActivityIndicator /> : null}
        {query.error || progress.error ? (
          <Text style={themed_s.error}>
            {query.error?.message || progress.error?.message}
          </Text>
        ) : null}
        {ride ? (
          <>
            <Text style={themed_s.label}>
              Mã chuyến #{ride.id}
            </Text>
            <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
            <DriverChatButton ride={ride} />
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
            <Pressable
              onPress={() =>
                void openExternalDirections(
                  isDropoff ? ride.dropoff : ride.pickup,
                )
              }
              style={themed_s.button}
            >
              <Text style={themed_s.buttonText}>
                Mở chỉ đường tới {isDropoff ? "điểm trả" : "điểm đón"} ↗
              </Text>
            </Pressable>
            {action ? (
              <Button
                disabled={progress.isPending}
                onPress={() => progress.mutate()}
                style={themed_s.button}
                label={progress.isPending ? "Đang cập nhật…" : action[0]}
                textStyle={themed_s.buttonText}
              />
            ) : null}
            {waitingForCustomer ? (
              <Text style={themed_s.text}>
                Đang chờ khách kiểm tra và xác nhận biên bản trước khi tiếp tục.
              </Text>
            ) : null}
            <Pressable onPress={() => router.push("/ride/vehicle-inspection")}>
              <Text style={themed_s.link}>
                Xem biên bản bàn giao / hoàn trả
              </Text>
            </Pressable>
            <Pressable onPress={() => void query.refetch()}>
              <Text style={themed_s.link}>Làm mới trạng thái chuyến</Text>
            </Pressable>
          </>
        ) : !query.isLoading ? (
          <Text style={themed_s.text}>Bạn chưa có chuyến đang hoạt động.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
