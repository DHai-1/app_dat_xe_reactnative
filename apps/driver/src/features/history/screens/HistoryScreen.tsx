import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { statusLabel } from "@/lib/displayLabels";
import { rideStyles } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import { Button, Card, GroupedList, Input, Typography as Text, useDebouncedTextChange, useThemeColors, useThemedStyles } from "@datxe/ui";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { List, RadioButton, TouchableRipple } from "react-native-paper";
import { useHistory } from "../hooks/useHistory";

export default function HistoryScreen() {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const codeDraft = useRef("");
  const [code, setCode] = useState("");
  const codeInput = useDebouncedTextChange(setCode);
  const q = useHistory(status === "all" ? undefined : status);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  const loadedTrips = q.data?.pages.flatMap((page) => page?.content ?? []) ?? [];
  const trips = loadedTrips.filter((trip) => period === "all" || new Date(trip.createdAt) >= cutoff);
  const filtered = status !== "all" || period !== "all";
  const hasMore = q.hasNextPage && (period === "all" || loadedTrips.length === trips.length);
  const open = (id: number) => router.push({ pathname: "/ride/complete", params: { rideId: String(id) } });

  return (
    <DriverPage title="Lịch sử chuyến" tabs loading={q.isLoading} error={q.error?.message} retry={q.refetch}>
      <GroupedList>
        <List.Accordion title="Tìm và lọc chuyến" theme={{ colors: { background: colors.transparent } }}
          style={styles.target} description={filtered ? "Đang áp dụng bộ lọc" : undefined}>
          <View style={styles.filters}>
            <Input label="Mã chuyến" defaultValue={code} onChangeText={(value) => {
              codeDraft.current = value.replace(/\D/g, "");
              codeInput.onChangeText(codeDraft.current);
            }}
              keyboardType="number-pad" maxLength={16} placeholder="Ví dụ 123" />
            <Button label="Mở theo mã chuyến" variant="secondary" disabled={!Number.isSafeInteger(Number(code)) || Number(code) < 1}
              onPress={() => {
                const id = Number(codeDraft.current);
                if (Number.isSafeInteger(id) && id > 0) open(id);
              }} />

            <Text style={s.label}>Trạng thái</Text>
            <RadioButton.Group value={status} onValueChange={setStatus}>
              <RadioButton.Item label="Tất cả" value="all" />
              <RadioButton.Item label="Hoàn thành" value="COMPLETED" />
              <RadioButton.Item label="Đã hủy" value="CANCELLED" />
            </RadioButton.Group>

            <Text style={s.label}>Thời gian</Text>
            <RadioButton.Group value={period} onValueChange={setPeriod}>
              <RadioButton.Item label="Mọi thời điểm" value="all" />
              <RadioButton.Item label="7 ngày gần nhất" value="week" />
            </RadioButton.Group>
          </View>
        </List.Accordion>
      </GroupedList>
      {trips.length ? (
        <GroupedList title="Danh sách chuyến">
          {trips.map((trip) => {
            const pickup = trip.pickupAddress ?? "Chưa có địa chỉ";
            const dropoff = trip.dropoffAddress ?? "Chưa có địa chỉ";
            const fare = formatMoney(trip.finalFare ?? trip.estimatedFare);
            const date = new Date(trip.createdAt).toLocaleString("vi-VN");
            const statusText = statusLabel("ride", trip.status).label;

            return (
              <TouchableRipple
                key={trip.id}
                onPress={() => open(trip.id)}
                accessibilityRole="button"
                accessibilityLabel={`Chuyến ${trip.id}, ${statusText}. ${date}. Đón tại ${pickup}. Trả tại ${dropoff}.${trip.status === "CANCELLED" ? "" : ` Cước ${fare}.`}`}
                style={styles.trip}
              >
                <View style={styles.tripContent}>
                  <View style={styles.tripHeader}>
                    <Text style={[s.text, styles.tripId]}>Chuyến #{trip.id}</Text>
                    <View style={styles.tripStatus}><StatusBadge kind="ride" value={trip.status} /></View>
                  </View>
                  <Text style={s.label}>{date}</Text>
                  <View style={[styles.stop, styles.pickup]}>
                    <View style={styles.dashedRail}>
                      {[0, 1, 2, 3].map((dash) => (
                        <View key={dash} style={[styles.dash, { backgroundColor: colors.outlineVariant }]} />
                      ))}
                    </View>
                    <View style={[styles.dot, { backgroundColor: colors.success }]} />
                    <Text style={[s.text, styles.address]} numberOfLines={2} ellipsizeMode="tail">{pickup}</Text>
                  </View>
                  <View style={styles.stop}>
                    <View style={[styles.dot, { backgroundColor: colors.error }]} />
                    <Text style={[s.text, styles.address]} numberOfLines={2} ellipsizeMode="tail">{dropoff}</Text>
                  </View>
                  {trip.status !== "CANCELLED" ? <Text style={[s.amount, styles.fare]}>{fare}</Text> : null}
                </View>
              </TouchableRipple>
            );
          })}
        </GroupedList>
      ) : !q.isLoading && !q.error ? (
        <Card style={s.card}>
          <Text>{hasMore ? "Chưa có chuyến phù hợp trong các trang đã tải." : filtered ? "Không có chuyến phù hợp với bộ lọc." : "Bạn chưa có chuyến đi."}</Text>
          {filtered ? (
            <Button variant="ghost" label="Xóa bộ lọc" onPress={() => { setStatus("all"); setPeriod("all"); }} />
          ) : <Button variant="ghost" label="Về trang chủ" onPress={() => router.navigate("/(tabs)/home")} />}
        </Card>
      ) : null}
      {hasMore ? <Button variant="secondary" label="Tải thêm chuyến" loading={q.isFetchingNextPage}
        onPress={() => void q.fetchNextPage()} /> : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  target: { minHeight: 48 },
  filters: { gap: 8, paddingVertical: 8 },
  trip: { borderRadius: 24, overflow: "hidden" },
  tripContent: { paddingVertical: 12 },
  tripHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  tripId: { flexShrink: 0, fontWeight: "600" },
  tripStatus: { flexShrink: 1 },
  stop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pickup: { marginTop: 8, paddingBottom: 8 },
  address: { flex: 1 },
  fare: { alignSelf: "flex-end", textAlign: "right", marginTop: 4, fontSize: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  dashedRail: { position: "absolute", left: 3, top: 16, bottom: -8, justifyContent: "space-evenly" },
  dash: { width: 2, height: 2 },
});
