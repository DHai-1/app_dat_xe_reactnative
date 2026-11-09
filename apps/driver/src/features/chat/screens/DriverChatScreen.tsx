import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { translate as t } from "@datxe/shared";
import { Button, ChatConversation, ScreenWrapper, Typography as Text, useLanguage, type ChatRow } from "@datxe/ui";
import { useSessionStore } from "@/lib/store";
import { canDriverChat } from "@/lib/chatAvailability";
import { useDriverChat } from "../hooks/useDriverChat";

export default function DriverChatScreen() {
  const { rideId: rawId } = useLocalSearchParams<{ rideId?: string | string[] }>();
  const rideId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const userId = useSessionStore((state) => state.user?.id);
  const router = useRouter();
  if (!Number.isSafeInteger(rideId) || rideId <= 0 || !userId) return (
    <ScreenWrapper>
      <View style={{ padding: 24, gap: 16 }}>
        <Text>{userId ? "Mã chuyến không hợp lệ." : "Vui lòng đăng nhập để xem cuộc trò chuyện."}</Text>
        <Button label={userId ? "Về trang chủ" : "Đăng nhập"} onPress={() => router.replace(userId ? "/(tabs)/home" : "/(auth)/login")} />
      </View>
    </ScreenWrapper>
  );
  return <RideChat key={`${userId}:${rideId}`} rideId={rideId} userId={userId} />;
}

function RideChat({ rideId, userId }: { rideId: number; userId: number }) {
  useLanguage();
  const h = useDriverChat(rideId, userId);
  const router = useRouter();
  const open = canDriverChat(h.ride);
  const rows = useMemo<ChatRow[]>(() => [
    ...h.messages.map((message): ChatRow => {
      const mine = message.senderRole === "DRIVER";
      return {
        key: message.clientMessageId ?? `server-${message.id}`,
        mine,
        createdAt: message.createdAt,
        content: message.content,
        image: message.attachmentUrl,
        delivery: mine ? (message.readAt ? "read" : "sent") : undefined,
      };
    }),
    ...h.outgoing.map((pending): ChatRow => ({
      key: pending.key,
      mine: true,
      createdAt: pending.createdAt,
      content: pending.body.content,
      image: pending.body.attachmentUrl ?? pending.file?.uri,
      delivery: pending.status,
      error: pending.error,
      retry: pending.status === "failed" ? () => void h.session.retry(pending.key) : undefined,
    })),
  ], [h.messages, h.outgoing, h.session]);

  return (
    <ChatConversation
      title={h.ride?.customer?.fullName?.trim() || t("Nhắn tin với khách")}
      subtitle={t("Chuyến #{0}{1}", { "0": rideId, "1": "" })}
      avatar={h.ride?.customer?.avatarUrl}
      rows={rows}
      draft={h.draft}
      onDraftChange={h.setDraft}
      loading={h.loading}
      busy={h.picking}
      enabled={open}
      notice={h.ride ? t("Cuộc trò chuyện đã đóng theo trạng thái chuyến. Bạn vẫn có thể xem tin nhắn cũ.") : undefined}
      emptyTitle={t(open ? "Bắt đầu trò chuyện với khách hàng." : "Chưa có tin nhắn trong chuyến này.")}
      error={h.error || h.pickerError}
      hasMore={h.hasMore}
      loadingOlder={h.loadingOlder}
      onBack={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/home")}
      onRefresh={() => void h.session.refresh()}
      onLoadOlder={() => void h.session.loadOlder()}
      onSend={h.sendText}
      onAttach={() => void h.sendImage()}
    />
  );
}
