import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { useHistory } from "../hooks/useHistory";
export default function HistoryScreen() {
  const themed_s = useThemedStyles(s);
  const q = useHistory(),
    router = useRouter();
  const trips = q.data?.pages.flatMap((page) => page?.content ?? []) ?? [];
  return (
    <DriverPage
      title="Lịch sử chuyến"
      tabs
      loading={q.isLoading}
      error={q.error?.message}
      retry={q.refetch}
    >
      {trips.map((trip) => (
        <Pressable
          key={trip.id}
          style={themed_s.card}
          onPress={() =>
            router.push({
              pathname: "/ride/complete",
              params: { rideId: String(trip.id) },
            })
          }
        >
          <Text style={themed_s.label}>
            Mã chuyến #{trip.id}
          </Text>
          <StatusBadge kind="ride" value={trip.status} contextLabel="Trạng thái chuyến" />
          <Text style={themed_s.text}>
            {trip.pickupAddress ?? "Chưa có địa chỉ"} →{" "}
            {trip.dropoffAddress ?? "Chưa có địa chỉ"}
          </Text>
          <Text style={themed_s.text}>
            {formatMoney(trip.finalFare ?? trip.estimatedFare)}
          </Text>
          <Text style={themed_s.label}>
            {new Date(trip.createdAt).toLocaleString("vi-VN")}
          </Text>
        </Pressable>
      ))}
      {!q.isLoading && !q.error && !trips.length ? (
        <Card style={themed_s.card}>
          <Text style={themed_s.text}>Bạn chưa có chuyến đi.</Text>
        </Card>
      ) : null}
      {q.hasNextPage ? (
        <Pressable
          disabled={q.isFetchingNextPage}
          onPress={() => void q.fetchNextPage()}
        >
          <Text style={themed_s.link}>
            {q.isFetchingNextPage ? "Đang tải…" : "Xem thêm"}
          </Text>
        </Pressable>
      ) : null}
    </DriverPage>
  );
}
