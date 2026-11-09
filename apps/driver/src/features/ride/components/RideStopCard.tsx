import { rideStyles } from "@/components/rideStyles";
import { openRideDirections } from "@/lib/navigation";
import type { CustomerRideDetail } from "@datxe/shared";
import { Button, Card, Typography as Text, useThemedStyles } from "@datxe/ui";

export function RideStopCard({ ride, phase }: { ride: CustomerRideDetail; phase: "pickup" | "dropoff" }) {
  const styles = useThemedStyles(rideStyles);
  const pickup = phase === "pickup";
  const address = pickup ? ride.pickupAddress : ride.dropoffAddress;
  const point = pickup ? ride.pickup : ride.dropoff;
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{pickup ? "Điểm đón" : "Điểm trả"} · #{ride.id}</Text>
      <Text style={styles.text}>{address || "Chưa có địa chỉ"}</Text>
      {pickup && ride.pickupNote ? (
        <>
          <Text style={styles.label}>Ghi chú điểm đón</Text>
          <Text style={styles.text}>{ride.pickupNote}</Text>
        </>
      ) : null}
      <Button
        variant="secondary"
        icon="directions"
        iconPosition="leading"
        disabled={point.lat == null || point.lng == null}
        label={pickup ? "Mở chỉ đường tới điểm đón" : "Mở chỉ đường tới điểm trả"}
        onPress={() => openRideDirections(ride, phase)}
      />
    </Card>
  );
}
