import { DriverPage } from "@/components/DriverPage";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useNotifications } from "../hooks/useNotifications";
function message(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  return (
    (["message", "body", "description", "content"]
      .map((k) => p[k])
      .find((v) => typeof v === "string") as string | undefined) ?? ""
  );
}
export default function NotificationsScreen() {
  const themed_s = useThemedStyles(s);
  const { query: q, mark } = useNotifications();
  const items = q.data ?? [];
  return (
    <DriverPage
      title="Thông báo"
      tabs
      loading={q.isLoading}
      error={q.error?.message || mark.error?.message}
      retry={q.refetch}
    >
      {items.some((item) => !item.readAt) ? (
        <Pressable disabled={mark.isPending} onPress={() => mark.mutate(null)}>
          <Text style={themed_s.link}>Đánh dấu tất cả đã đọc</Text>
        </Pressable>
      ) : null}
      {items.map((item) => (
        <Pressable
          key={item.id}
          disabled={mark.isPending || Boolean(item.readAt)}
          onPress={() => mark.mutate(item.id)}
          style={themed_s.card}
        >
          <Text style={themed_s.label}>
            {item.readAt ? "Đã đọc" : "Chưa đọc"} · {item.type}
          </Text>
          <Text style={themed_s.text}>
            {message(item.payload) || "Có cập nhật từ hệ thống."}
          </Text>
          <Text style={themed_s.label}>
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </Text>
        </Pressable>
      ))}
      {!q.isLoading && !q.error && !items.length ? (
        <Card style={themed_s.card}>
          <Text style={themed_s.text}>Chưa có thông báo.</Text>
        </Card>
      ) : null}
    </DriverPage>
  );
}
