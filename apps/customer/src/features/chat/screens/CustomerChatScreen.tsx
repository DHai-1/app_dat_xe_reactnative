import { HeaderIconButton, ScreenHeader } from "@/components/ScreenHeader";
import { getLocale, translate as i18nT } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import { styles as base_styles } from "../components/CustomerChatScreenParts";
import { useCustomerChat } from "../hooks/useCustomerChat";
export default function CustomerChatScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    rideId,
    ride,
    messages,
    draft,
    setDraft,
    loading,
    loadingOlder,
    sending,
    hasMore,
    error,
    refresh,
    loadOlder,
    sendText,
    sendImage,
    chatEnabled,
  } = useCustomerChat();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Nhắn tin tài xế")}
        subtitle={i18nT(
          i18nT("Chuyến #{0}{1}", {
            "0": rideId,
            "1": ride?.driverId
              ? i18nT(" · Tài xế #{0}", { "0": ride.driverId })
              : "",
          }),
        )}
        onBack={() => router.back()}
        rightContent={
          <HeaderIconButton
            icon="refresh"
            accessibilityLabel={i18nT("Làm mới tin nhắn")}
            onPress={() => void refresh(true)}
            tone="primary"
          />
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {hasMore ? (
            <Pressable
              disabled={loadingOlder}
              onPress={() => void loadOlder()}
              style={styles.loadOlder}
            >
              {loadingOlder ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.link}>{i18nT("Tải tin nhắn cũ")}</Text>
              )}
            </Pressable>
          ) : null}
          {loading && messages.length === 0 ? (
            <ActivityIndicator color={colors.primary} />
          ) : null}
          {!loading && messages.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons
                name="chat-bubble-outline"
                size={36}
                color={colors.primary}
              />
              <Text style={styles.emptyTitle}>
                {i18nT(
                  chatEnabled
                    ? "Bắt đầu cuộc trò chuyện"
                    : "Chat sẽ mở khi có tài xế nhận chuyến",
                )}
              </Text>
              <Text style={styles.emptyCopy}>
                {i18nT(
                  chatEnabled
                    ? "Trao đổi với tài xế về điểm đón hoặc chuyến đi."
                    : "Bạn có thể trò chuyện từ khi có tài xế đến khi hoàn tất bàn giao.",
                )}
              </Text>
            </View>
          ) : null}
          {messages.map((message) => {
            const mine = message.senderRole === "CUSTOMER";
            return (
              <View
                key={message.id}
                style={[styles.messageRow, mine && styles.messageRowMine]}
              >
                <View
                  style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleDriver,
                  ]}
                >
                  {message.attachmentUrl ? (
                    <Image
                      source={{ uri: message.attachmentUrl }}
                      style={styles.attachment}
                      resizeMode="cover"
                    />
                  ) : null}
                  {message.content ? (
                    <Text
                      style={[
                        styles.messageText,
                        mine && styles.messageTextMine,
                      ]}
                    >
                      {message.content}
                    </Text>
                  ) : null}
                  {!message.content && !message.attachmentUrl ? (
                    <Text
                      style={[
                        styles.messageText,
                        mine && styles.messageTextMine,
                      ]}
                    >
                      {i18nT("Tin nhắn")}
                    </Text>
                  ) : null}
                  <Text
                    style={[styles.messageTime, mine && styles.messageTimeMine]}
                  >
                    {i18nT(
                      new Date(message.createdAt).toLocaleTimeString(
                        getLocale(),
                        { hour: "2-digit", minute: "2-digit" },
                      ),
                    )}
                  </Text>
                </View>
              </View>
            );
          })}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {i18nT(error)}
            </Text>
          ) : null}
        </ScrollView>
        {!chatEnabled ? (
          <View style={styles.closedNotice}>
            <Text style={styles.closedText}>
              {i18nT(
                ride
                  ? "Cuộc trò chuyện hiện đã đóng theo trạng thái chuyến."
                  : "Đang tải thông tin chuyến.",
              )}
            </Text>
          </View>
        ) : null}
        <View style={styles.composer}>
          <Pressable
            accessibilityLabel={i18nT("Gửi ảnh")}
            disabled={sending || !chatEnabled}
            onPress={() => void sendImage()}
            style={[
              styles.imageButton,
              (!chatEnabled || sending) && styles.disabled,
            ]}
          >
            <MaterialIcons name="image" size={23} color={colors.primary} />
          </Pressable>
          <TextInput
            accessibilityLabel={i18nT("Tin nhắn")}
            editable={chatEnabled && !sending}
            value={draft}
            onChangeText={setDraft}
            placeholder={i18nT(
              chatEnabled ? "Nhập tin nhắn…" : "Chat chưa khả dụng",
            )}
            maxLength={1000}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityLabel={i18nT("Gửi tin nhắn")}
            disabled={!draft.trim() || sending || !chatEnabled}
            onPress={() => void sendText()}
            style={[
              styles.sendButton,
              (!draft.trim() || sending || !chatEnabled) && styles.disabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <MaterialIcons name="send" size={21} color={colors.onPrimary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
