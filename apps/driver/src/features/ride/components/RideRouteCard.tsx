import { openRideDirections } from "@/lib/navigation";
import type { CustomerRideDetail } from "@datxe/shared";
import { Card, Typography as Text, useThemeColors } from "@datxe/ui";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "react-native-paper";

export function RideRouteCard({
  ride,
  navigationStop,
  children,
}: {
  ride: CustomerRideDetail;
  navigationStop?: "pickup" | "dropoff";
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <Card style={[styles.card, { backgroundColor: colors.rideSurface }]}>
      <Text accessibilityRole="header" style={styles.heading}>Lộ trình</Text>
      {(navigationStop === "dropoff" ? (["dropoff", "pickup"] as const) : (["pickup", "dropoff"] as const)).map((stop, index) => {
        const pickup = stop === "pickup";
        const label = pickup ? (navigationStop === "dropoff" ? "Điểm đón đã qua" : "Điểm đón") : "Điểm trả";
        const point = ride[stop];
        const address = pickup ? ride.pickupAddress : ride.dropoffAddress;
        return (
          <View key={stop} style={styles.stop}>
            {index === 0 ? <View style={[styles.connector, { borderColor: colors.outline }]} /> : null}
            <View style={[styles.dot, { backgroundColor: pickup ? colors.successStrong : colors.error }]} />
            <View style={styles.address}>
              <Text style={[styles.label, { color: navigationStop === stop ? colors.onSurface : colors.onSurfaceVariant }]}>{label}</Text>
              <Text style={styles.addressText}>{address || "Chưa có địa chỉ"}</Text>
              {pickup && navigationStop !== "dropoff" && ride.pickupNote ? (
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Ghi chú: {ride.pickupNote}</Text>
              ) : null}
            </View>
            {navigationStop === stop ? (
              <IconButton
                icon="navigation-variant"
                mode="contained-tonal"
                size={24}
                style={styles.navigation}
                containerColor={colors.secondaryContainer}
                iconColor={colors.onSecondaryContainer}
                accessibilityLabel={pickup ? "Mở chỉ đường tới điểm đón" : "Mở chỉ đường tới điểm trả"}
                disabled={point.lat == null || point.lng == null}
                onPress={() => openRideDirections(ride, stop)}
              />
            ) : null}
          </View>
        );
      })}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 12 },
  heading: { fontSize: 18, fontWeight: "700" },
  stop: { flexDirection: "row", gap: 12, minHeight: 48 },
  connector: {
    position: "absolute", top: 17, bottom: -25, left: 4,
    borderLeftWidth: 1, borderStyle: "dashed",
  },
  dot: { width: 9, height: 9, marginTop: 8, borderRadius: 999 },
  address: { flex: 1, minWidth: 0, gap: 3 },
  label: { fontSize: 13 },
  addressText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  navigation: { width: 48, height: 48, borderRadius: 24, margin: 0, alignSelf: "center" },
});
