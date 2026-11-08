import { translate as t } from "@datxe/shared";
import { ChatConversation, useLanguage, type ChatRow } from "@datxe/ui";
import { useMemo } from "react";

import { useCustomerChat } from "../hooks/useCustomerChat";

export default function CustomerChatScreen() {
  useLanguage();
  const h = useCustomerChat();
  const rows = useMemo(() => h.messages.map((message): ChatRow => {
    const mine = message.senderRole === "CUSTOMER";
    return {
      key: String(message.id),
      mine,
      createdAt: message.createdAt,
      content: message.content,
      image: message.attachmentUrl,
      delivery: mine ? (message.readAt ? "read" : "sent") : undefined,
    };
  }), [h.messages]);

  return (
    <ChatConversation
      key={`${h.rideId}:${h.ride?.driverId ?? ""}`}
      title={h.ride?.driver?.fullName?.trim() || t("Nhắn tin tài xế")}
      subtitle={t("Chuyến #{0}{1}", {
        "0": h.rideId || "—",
        "1": h.ride?.driverId && !h.ride.driver?.fullName?.trim()
          ? t(" · Tài xế #{0}", { "0": h.ride.driverId })
          : "",
      })}
      avatar={h.ride?.driver?.avatarUrl}
      rows={rows}
      draft={h.draft}
      onDraftChange={h.setDraft}
      loading={h.loading}
      busy={h.sending}
      enabled={h.chatEnabled}
      notice={t(h.ride ? "Cuộc trò chuyện hiện đã đóng theo trạng thái chuyến." : "Đang tải thông tin chuyến.")}
      emptyTitle={t(h.chatEnabled ? "Bắt đầu cuộc trò chuyện" : "Chat sẽ mở khi có tài xế nhận chuyến")}
      emptyHint={t(h.chatEnabled
        ? "Trao đổi với tài xế về điểm đón hoặc chuyến đi."
        : "Bạn có thể trò chuyện từ khi có tài xế đến khi hoàn tất bàn giao.")}
      error={h.error ? t(h.error) : undefined}
      hasMore={h.hasMore}
      loadingOlder={h.loadingOlder}
      onBack={() => h.router.back()}
      onRefresh={() => void h.refresh(true)}
      onLoadOlder={() => void h.loadOlder()}
      onSend={() => void h.sendText()}
      onAttach={() => void h.sendImage()}
    />
  );
}
