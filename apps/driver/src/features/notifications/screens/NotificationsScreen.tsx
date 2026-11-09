import { driverApi } from "@/lib/driverApi";
import { DriverPage } from "@/components/DriverPage";
import { resolveDriverNotification } from "@/lib/notificationDestination";
import { useSessionStore } from "@/lib/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { getLocale, getNotificationText, type CustomerNotification } from "@datxe/shared";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  GroupedList,
  Typography as Text,
  SettingsListItem,
  useThemeColors,
  useThemedStyles,
  useTranslation,
} from "@datxe/ui";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNotifications } from "../hooks/useNotifications";
export default function NotificationsScreen() {
  const t = useTranslation();
  const themed_s = useThemedStyles(s);
  const { query: q, mark } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const allItems = q.data ?? [];
  const items = unreadOnly ? allItems.filter((item) => !item.readAt) : allItems;
  const { data: count } = useQuery({ queryKey: ["driver", "notifications", "count"], queryFn: driverApi.notificationCount });
  const unread = count?.unread_count ?? allItems.filter((item) => !item.readAt).length;
  const groups = new Map<string, CustomerNotification[]>();
  for (const item of items) {
    const date = new Date(item.createdAt).toLocaleDateString(getLocale());
    const group = groups.get(date);
    if (group) group.push(item);
    else groups.set(date, [item]);
  }
  const router = useRouter();
  const colors = useThemeColors();
  const open = useMutation({
    mutationFn: async ({ item, userId }: { item: CustomerNotification; userId: number }) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      return resolveDriverNotification({ type: item.type, payload: item.payload, messageId: item.messageId });
    },
  });
  const openItem = (item: CustomerNotification) => {
    const userId = useSessionStore.getState().user?.id;
    if (!userId) return;
    if (!item.readAt) mark.mutate(item.id);
    open.mutate({ item, userId }, { onSuccess: ({ notice, ...destination }) => {
      if (useSessionStore.getState().user?.id !== userId) return;
      if (notice) setNotice(notice);
      else if (destination.pathname !== "/(tabs)/notifications") router.push(destination as Href);
    } });
  };
  const [notice, setNotice] = useState("");
  return (
    <DriverPage
      title="Thông báo"
      tabs
      loading={q.isLoading}
      error={q.error?.message || mark.error?.message || open.error?.message}
      retry={q.error ? q.refetch : undefined}
    >
      {unread ? (
        <Card style={themed_s.card}>
          <Text style={themed_s.text}>{unread} {t("thông báo chưa đọc")}</Text>
          <Button
            variant="ghost"
            disabled={mark.isPending}
            label="Đánh dấu tất cả đã đọc"
            onPress={() => mark.mutate(null)}
          />
        </Card>
      ) : null}
      {allItems.length || unreadOnly ? (
        <Button variant="secondary" label={unreadOnly ? "Xem tất cả thông báo" : "Chỉ xem chưa đọc"}
          onPress={() => setUnreadOnly(!unreadOnly)} />
      ) : null}
      {notice ? <Card style={themed_s.card}><Text accessibilityRole="alert">{notice}</Text></Card> : null}
      {[...groups].map(([date, group]) => (
        <GroupedList key={date} title={date}>
          {group.map((item) => {
            const text = getNotificationText(item.type, item.payload, t);
            return (
              <SettingsListItem
                key={item.id}
                title={text.title}
                description={`${text.description}\n${new Date(item.createdAt).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })}`}
                icon={item.readAt ? "notifications-none" : "notifications"}
                disabled={open.isPending}
                right={item.readAt ? undefined : <View accessibilityLabel="Chưa đọc" style={[styles.unreadDot, { backgroundColor: colors.onSurfaceVariant }]} />}
                onPress={() => { setNotice(""); openItem(item); }}
              />
            );
          })}
        </GroupedList>
      ))}
      {!q.isLoading && !q.error && !items.length ? (
        <Card style={themed_s.card}>
          <Text style={themed_s.text}>{unreadOnly ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."}</Text>
        </Card>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ unreadDot: { width: 8, height: 8, borderRadius: 999 } });
