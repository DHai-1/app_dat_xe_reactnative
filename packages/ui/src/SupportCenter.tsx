import type {
  SupportDraft,
  SupportImage,
  SupportRide,
  SupportTicket,
} from "@datxe/shared";
import { Fragment, useRef, useState } from "react";
import { Divider, List, RadioButton } from "react-native-paper";
import { Image, Modal, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { Typography as Text } from "./components/Typography";
import { ThemedTextInput as TextInput } from "./components/ThemedTextInput";
import { useThemedStyles, type ThemeColors } from "./theme/ThemeProvider";
import { ScreenWrapper } from "./components/ScreenWrapper";

const categories = {
  TRIP: "Sự cố chuyến đi",
  PAYMENT: "Thanh toán",
  HANDOVER: "Bàn giao xe",
  ACCOUNT: "Tài khoản",
  OTHER: "Vấn đề khác",
};
const statuses = {
  OPEN: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã trả lời",
};
const requestId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const n = Math.floor(Math.random() * 16);
    return (char === "x" ? n : (n & 3) | 8).toString(16);
  });

export function EvidenceEditor({
  images,
  onChange,
  pick,
  disabled = false,
  onBusyChange,
}: {
  images: SupportImage[];
  onChange: (images: SupportImage[]) => void;
  pick: () => Promise<SupportImage | null>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const s = useThemedStyles(styles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const add = async () => {
    if (lock.current || disabled || images.length >= 5) return;
    lock.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const image = await pick();
      if (image) onChange([...images, image]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa tải được ảnh. Hãy thử lại.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  return (
    <View style={s.attachments}>
      {images.map((image, index) => (
        <View key={image.publicId} style={s.stack}>
          <Image
            source={{ uri: image.fileUrl }}
            style={s.image}
            accessibilityLabel={`Ảnh đính kèm ${index + 1}`}
          />
          <Button
            label={`Bỏ ảnh ${index + 1}`}
            variant="ghost"
            disabled={disabled || busy}
            onPress={() =>
              onChange(
                images.filter((item) => item.publicId !== image.publicId),
              )
            }
          />
        </View>
      ))}
      <Button
        label={busy ? "Đang tải ảnh…" : `Thêm ảnh (${images.length}/5)`}
        variant="secondary"
        style={s.action}
        disabled={disabled || busy || images.length >= 5}
        onPress={() => void add()}
      />
      {busy ? <Text>Chờ ảnh tải xong trước khi gửi yêu cầu.</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function SupportCenter({
  rides,
  tickets,
  send,
  pickImage,
  loadMoreRides,
  loadMoreTickets,
  initialRideId,
  pending,
  loading,
  error: loadError,
  onRefresh,
  onOpenRide,
  onOpenSafety,
}: {
  rides: SupportRide[];
  tickets: SupportTicket[];
  send: (draft: SupportDraft) => Promise<SupportTicket>;
  pickImage: () => Promise<SupportImage | null>;
  loadMoreRides?: () => void;
  loadMoreTickets?: () => void;
  initialRideId?: number;
  pending: boolean;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenRide?: (id: number) => void;
  onOpenSafety?: () => void;
}) {
  const s = useThemedStyles(styles);
  const [ticketStatus, setTicketStatus] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const visibleTickets = tickets.filter((ticket) => ticketStatus === "all" || ticket.status === ticketStatus);
  const [rideId, setRideId] = useState<number | null>(initialRideId || null);
  const [chooseRide, setChooseRide] = useState(false);
  const [category, setCategory] = useState("TRIP");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<SupportImage[]>([]);
  const [receipt, setReceipt] = useState<SupportTicket | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sendLock = useRef(false);
  const submission = useRef<{ body: string; id: string } | null>(null);
  const submit = async () => {
    if (sendLock.current || sending || pending || uploading) return;
    if (description.trim().length < 10) {
      setError("Hãy mô tả vấn đề ít nhất 10 ký tự.");
      return;
    }
    const body = { rideId, category, description: description.trim(), images };
    const serialized = JSON.stringify(body);
    if (submission.current?.body !== serialized)
      submission.current = { body: serialized, id: requestId() };
    sendLock.current = true;
    setSending(true);
    setError("");
    try {
      setReceipt(
        await send({ ...body, clientRequestId: submission.current.id }),
      );
      setDescription("");
      setImages([]);
      submission.current = null;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Gửi chưa thành công. Bạn có thể thử lại.",
      );
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  };
  return (
    <View style={s.stack}>
      <Card style={s.warning}>
        <Text accessibilityRole="header" style={s.warningTitle}>
          Kênh này không xử lý khẩn cấp
        </Text>
        <Text style={s.warningBody}>
          Yêu cầu được lưu và có mã tiếp nhận. Bộ phận hỗ trợ chưa cam kết thời
          gian phản hồi.
        </Text>
        {onOpenSafety ? <Button variant="secondary" label="Mở trang An toàn" onPress={onOpenSafety} /> : null}
      </Card>
      {receipt ? (
        <Card style={s.form}>
          <Text accessibilityRole="header" style={s.title}>
            Đã tiếp nhận · {receipt.code}
          </Text>
          <Text>
            Giữ mã này để tra cứu. Bộ phận hỗ trợ sẽ xem xét nội dung bạn gửi.
          </Text>
        </Card>
      ) : null}
      <Card>
        <List.Item
          title="Chuyến liên quan"
          description={
            rideId
              ? `Chuyến #${rideId} · Đổi chuyến`
              : "Chọn chuyến liên quan · Tùy chọn"
          }
          descriptionNumberOfLines={2}
          titleStyle={s.rowTitle}
          descriptionStyle={s.meta}
          disabled={sending}
          accessibilityRole="button"
          onPress={() => setChooseRide(true)}
          style={s.listRow}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </Card>
      <Card style={s.topics}>
        <Text accessibilityRole="header" style={s.title}>
          Bạn cần hỗ trợ về
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Bạn cần hỗ trợ về"
        >
          {Object.entries(categories).map(([value, label], index) => (
            <Fragment key={value}>
              {index > 0 ? <Divider style={s.divider} /> : null}
              <List.Item
                title={label}
                titleNumberOfLines={2}
                titleStyle={s.rowTitle}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: category === value,
                  disabled: sending,
                }}
                disabled={sending}
                onPress={() => setCategory(value)}
                style={s.listRow}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      category === value ? "radiobox-marked" : "radiobox-blank"
                    }
                    color={category === value ? s.selected.color : s.meta.color}
                  />
                )}
              />
            </Fragment>
          ))}
        </View>
      </Card>
      <Card style={s.form}>
        <Text accessibilityRole="header" style={s.title}>
          Gửi yêu cầu cho bộ phận hỗ trợ
        </Text>
        <Text style={s.meta}>
          Điều gì đã xảy ra? Bạn cần hỗ trợ như thế nào?
        </Text>
        <TextInput
          accessibilityLabel="Mô tả sự cố"
          placeholder="Nhập mô tả vấn đề…"
          draftValue={description}
          editable={!sending}
          onChangeText={setDescription}
          multiline
          maxLength={4000}
          style={s.input}
        />
        <Text style={s.counter}>
          {description.length}/4000 ký tự · Tối thiểu 10 ký tự
        </Text>
        <EvidenceEditor
          images={images}
          onChange={setImages}
          pick={pickImage}
          disabled={sending}
          onBusyChange={setUploading}
        />
        {error ? (
          <Text style={s.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <Button
          label={sending ? "Đang gửi…" : "Gửi yêu cầu hỗ trợ"}
          style={s.action}
          disabled={sending || pending || uploading}
          onPress={() => void submit()}
        />
      </Card>
      <View style={s.ticketHeading}>
        <View style={s.ticketHeadingRow}>
          <Text accessibilityRole="header" style={[s.title, s.flex]}>
            Yêu cầu của bạn
          </Text>
          {onRefresh ? (
            <Button
              label="Tải lại"
              accessibilityLabel="Tải lại phản hồi hỗ trợ"
              variant="ghost"
              style={s.refresh}
              onPress={onRefresh}
            />
          ) : null}
        </View>
        {!tickets.length && !loading && !loadError ? (
          <Text style={s.meta}>Chưa có yêu cầu hỗ trợ.</Text>
        ) : null}
      </View>
      {onOpenRide && tickets.length ? (
        <Card>
          <List.Accordion theme={{ colors: { background: s.accordion.backgroundColor } }} title="Lọc yêu cầu" description={ticketStatus === "all" ? undefined : statuses[ticketStatus as keyof typeof statuses]}>
            <RadioButton.Group value={ticketStatus} onValueChange={setTicketStatus}>
              <RadioButton.Item value="all" label="Tất cả" />
              {Object.entries(statuses).map(([value, label]) => <RadioButton.Item key={value} value={value} label={label} />)}
            </RadioButton.Group>
          </List.Accordion>
        </Card>
      ) : null}
      {tickets.length && !visibleTickets.length ? <Text style={s.meta}>Chưa có yêu cầu phù hợp trong danh sách đã tải.</Text> : null}
      {visibleTickets.map((ticket) => (
        <Card key={ticket.id} style={s.form}>
          <Text style={s.title}>
            {ticket.code} · {statuses[ticket.status]}
          </Text>
          <Text>
            {categories[ticket.category as keyof typeof categories] ?? "Hỗ trợ"}
            {ticket.rideId ? ` · Chuyến #${ticket.rideId}` : ""}
          </Text>
          <Text style={s.meta}>
            {new Date(ticket.createdAt).toLocaleString("vi-VN")}
          </Text>
          {onOpenRide ? (
            <Button variant="ghost" label={expandedTicket === ticket.id ? "Thu gọn" : "Xem chi tiết yêu cầu"}
              onPress={() => setExpandedTicket((current) => current === ticket.id ? null : ticket.id)} />
          ) : null}
          {!onOpenRide || expandedTicket === ticket.id ? (
            <>
              <Text>{ticket.description}</Text>
              {ticket.images.map((image) => (
                <Image
                  key={image.publicId}
                  source={{ uri: image.fileUrl }}
                  style={s.image}
                  accessibilityLabel="Ảnh yêu cầu hỗ trợ"
                />
              ))}
              {ticket.response ? (
                <>
                  <Text style={s.title}>Phản hồi từ bộ phận hỗ trợ</Text>
                  <Text>{ticket.response}</Text>
                </>
              ) : (
                <Text style={s.meta}>
                  Chưa có phản hồi. Bạn có thể tải lại để kiểm tra.
                </Text>
              )}
              {ticket.rideId && onOpenRide ? (
                <Button variant="secondary" label={`Mở chuyến #${ticket.rideId}`} onPress={() => onOpenRide(ticket.rideId!)} />
              ) : null}
            </>
          ) : null}
        </Card>
      ))}
      {loadMoreTickets ? (
        <Button
          label="Xem thêm yêu cầu"
          variant="secondary"
          onPress={loadMoreTickets}
        />
      ) : null}
      <Modal
        visible={chooseRide}
        animationType="slide"
        onRequestClose={() => setChooseRide(false)}
      >
        <ScreenWrapper>
          <View style={s.modalHeader}>
            <Text accessibilityRole="header" style={s.title}>
              Chọn chuyến cần hỗ trợ
            </Text>
            <Button
              label="Đóng danh sách chuyến"
              variant="ghost"
              onPress={() => setChooseRide(false)}
            />
          </View>
          <ScrollView
            contentContainerStyle={s.modal}
            keyboardShouldPersistTaps="handled"
          >
            <Card>
              <List.Item
                title="Không gắn chuyến"
                titleStyle={s.rowTitle}
                onPress={() => {
                  setRideId(null);
                  setChooseRide(false);
                }}
                style={s.listRow}
              />
              {rides.map((ride) => (
                <Fragment key={ride.id}>
                  <Divider style={s.divider} />
                  <List.Item
                    title={`Chuyến #${ride.id}`}
                    description={`${ride.pickupAddress ?? "Điểm đón"} → ${ride.dropoffAddress ?? "Điểm đến"}`}
                    titleStyle={s.rowTitle}
                    descriptionStyle={s.meta}
                    descriptionNumberOfLines={4}
                    onPress={() => {
                      setRideId(ride.id);
                      setChooseRide(false);
                    }}
                    style={s.listRow}
                    right={
                      rideId === ride.id
                        ? (props) => (
                            <List.Icon
                              {...props}
                              icon="check"
                              color={s.selected.color}
                            />
                          )
                        : undefined
                    }
                  />
                </Fragment>
              ))}
            </Card>
            {loadMoreRides ? (
              <Button
                label="Xem thêm chuyến"
                variant="ghost"
                onPress={loadMoreRides}
              />
            ) : null}
          </ScrollView>
        </ScreenWrapper>
      </Modal>
    </View>
  );
}

const styles = (c: ThemeColors) =>
  StyleSheet.create({
    accordion: { backgroundColor: c.transparent },
    stack: { gap: 16 },
    form: { gap: 12, padding: 16 },
    topics: { gap: 8, padding: 16 },
    title: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "500",
      color: c.onSurface,
    },
    rowTitle: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "500",
      color: c.onSurface,
    },
    listRow: { minHeight: 56, paddingHorizontal: 0, paddingVertical: 8 },
    selected: { color: c.primary },
    meta: { color: c.onSurfaceMuted, fontSize: 14, lineHeight: 22 },
    divider: { backgroundColor: c.outlineSubtle },
    warning: { gap: 8, padding: 16, backgroundColor: c.safetyContainer },
    warningTitle: {
      color: c.onSafetyContainer,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "500",
    },
    warningBody: { color: c.onSafetyContainer, fontSize: 14, lineHeight: 22 },
    input: {
      minHeight: 144,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: c.outlineSubtle,
      backgroundColor: c.inputSurface,
      borderRadius: 24,
      padding: 16,
      fontSize: 16,
      lineHeight: 24,
    },
    counter: { color: c.onSurfaceMuted, fontSize: 12, lineHeight: 18 },
    attachments: { gap: 12, marginTop: 12 },
    action: { minHeight: 48, marginVertical: 12 },
    image: { width: "100%", height: 180, borderRadius: 24 },
    error: { color: c.error, lineHeight: 22 },
    flex: { flex: 1, minWidth: 0 },
    refresh: { width: "auto", alignSelf: "flex-start" },
    ticketHeadingRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    ticketHeading: { gap: 8, paddingHorizontal: 16 },
    modalHeader: { flexShrink: 0, padding: 16, gap: 8 },
    modal: { padding: 16, paddingBottom: 32, gap: 16 },
  });
