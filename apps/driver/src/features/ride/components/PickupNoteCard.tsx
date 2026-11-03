import { rideStyles as s } from "@/components/rideStyles";
import { openExternalDirections } from "@/lib/navigation";
import {
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useQuery } from "@tanstack/react-query";
import { getDriverActiveRide } from "../api";
export function PickupNoteCard() {
  const themed_s = useThemedStyles(s);

  const query = useQuery({
    queryKey: ["driver", "activeRide"],
    queryFn: getDriverActiveRide,
  });
  const ride = query.data;
  if (!ride) return null;
  return (
    <Card style={themed_s.card}>
      <Text style={themed_s.label}>ĐIỂM ĐÓN · #{ride.id}</Text>
      <Text style={themed_s.text}>{ride.pickupAddress}</Text>
      <Text style={themed_s.label}>GHI CHÚ ĐIỂM ĐÓN</Text>
      <Text style={themed_s.text}>
        {ride.pickupNote || "Khách chưa thêm ghi chú điểm đón."}
      </Text>
      <Pressable onPress={() => void openExternalDirections(ride.pickup)}>
        <Text style={themed_s.link}>Mở chỉ đường tới điểm đón ↗</Text>
      </Pressable>
    </Card>
  );
}
