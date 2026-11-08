import { translate } from "../i18n";

export type NotificationText = { title: string; description: string };
type Translator = (value: string) => string;

/** Vietnamese source keys; the existing English catalog provides their translations. */
const messages: Readonly<Record<string, NotificationText>> = {
  RIDE_COMPLETED: {
    title: "Chuyến đi hoàn thành",
    description: "Chuyến đi của bạn đã kết thúc thành công.",
  },
  RIDE_REDISPATCHED: { title: "Đang tìm tài xế khác", description: "Tài xế trước không thể tiếp tục. Hệ thống đang tìm tài xế khác cho bạn." },
  RIDE_UPDATED: {
    title: "Cập nhật chuyến đi",
    description: "Thông tin chuyến đi của bạn vừa được cập nhật.",
  },
  RIDE_CANCELLED: {
    title: "Chuyến đi đã hủy",
    description: "Chuyến đi của bạn đã bị hủy.",
  },
  RIDE_ASSIGNED: {
    title: "Đã có tài xế nhận chuyến",
    description: "Tài xế đã nhận chuyến đi của bạn.",
  },
  DRIVER_ARRIVING: {
    title: "Tài xế đang đến",
    description: "Tài xế đang di chuyển đến điểm đón của bạn.",
  },
  DRIVER_ARRIVED: {
    title: "Tài xế đã đến",
    description: "Tài xế đã đến điểm đón của bạn.",
  },
  VEHICLE_HANDOVER: {
    title: "Đang bàn giao xe",
    description: "Quá trình bàn giao xe cho tài xế đang được thực hiện.",
  },
  IN_PROGRESS: {
    title: "Chuyến đi đang diễn ra",
    description: "Chuyến đi của bạn đã bắt đầu.",
  },
  ARRIVED_DESTINATION: {
    title: "Đã đến điểm đến",
    description: "Chuyến đi của bạn đã đến điểm đến.",
  },
  VEHICLE_RETURNED: {
    title: "Xe đã được hoàn trả",
    description: "Quá trình hoàn trả xe đã hoàn tất.",
  },
  FAILED_SYSTEM: { title: "Lỗi hệ thống", description: "Không thể tìm tài xế do lỗi hệ thống" },
  RIDE_NO_DRIVER: {
    title: "Chưa tìm được tài xế",
    description: "Hiện chưa tìm được tài xế phù hợp cho chuyến đi của bạn.",
  },
  EXPIRED: {
    title: "Yêu cầu chuyến đã hết hạn",
    description: "Yêu cầu chuyến đi của bạn đã hết thời gian chờ.",
  },
  PENDING: {
    title: "Đang tiếp nhận chuyến đi",
    description: "Yêu cầu chuyến đi của bạn đang được tiếp nhận.",
  },
  SEARCHING: {
    title: "Đang tìm tài xế",
    description: "Hệ thống đang tìm tài xế phù hợp cho chuyến đi của bạn.",
  },
  RIDE_OFFER: {
    title: "Yêu cầu chuyến mới",
    description: "Bạn có yêu cầu chuyến đi mới cần phản hồi.",
  },
  OFFER_EXPIRED: {
    title: "Lời mời nhận chuyến đã hết hạn",
    description: "Thời gian phản hồi lời mời nhận chuyến đã kết thúc.",
  },
  OFFER_CANCELLED: {
    title: "Lời mời nhận chuyến đã hủy",
    description: "Lời mời nhận chuyến này không còn khả dụng.",
  },
  HANDOVER_CONFIRMED: {
    title: "Đã xác nhận bàn giao",
    description: "Biên bản bàn giao xe đã được xác nhận.",
  },
  DRIVER_DOCUMENT_REVIEWED: {
    title: "Đã có kết quả kiểm tra giấy tờ",
    description: "Vui lòng xem kết quả kiểm tra giấy tờ trong hồ sơ của bạn.",
  },
  DRIVER_VERIFICATION_UPDATED: {
    title: "Hồ sơ tài xế có cập nhật",
    description: "Thông tin xét duyệt hồ sơ tài xế của bạn vừa được cập nhật.",
  },
  DRIVER_FORCE_OFFLINE: {
    title: "Đã tạm ngừng nhận chuyến",
    description:
      "Tài khoản tài xế của bạn đã chuyển sang trạng thái tạm ngừng nhận chuyến.",
  },
  CHAT_MESSAGE: {
    title: "Tin nhắn mới",
    description: "Bạn có tin nhắn mới liên quan đến chuyến đi.",
  },
  CHAT_READ: {
    title: "Tin nhắn đã được đọc",
    description: "Tin nhắn của bạn đã được người nhận đọc.",
  },
  DEFAULT: {
    title: "Thông báo mới",
    description: "Bạn có thông báo mới từ hệ thống.",
  },
};

const aliases: Readonly<Record<string, string>> = {
  COMPLETED: "RIDE_COMPLETED",
  CANCELLED: "RIDE_CANCELLED",
  DRIVER_ASSIGNED: "RIDE_ASSIGNED",
  NO_DRIVER_FOUND: "RIDE_NO_DRIVER",
};
const rideStatuses = new Set([
  "PENDING",
  "SEARCHING",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
  "COMPLETED",
  "CANCELLED",
  "FAILED_SYSTEM",
  "NO_DRIVER_FOUND",
  "EXPIRED",
]);
const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);
const identifier = (value: unknown): string =>
  typeof value === "string"
    ? value
        .trim()
        .replace(/[\s-]+/g, "_")
        .toUpperCase()
    : "";
const lookup = (value: unknown): NotificationText | undefined => {
  const key = identifier(value);
  const canonical = own(aliases, key) ? aliases[key] : key;
  return own(messages, canonical) && canonical !== "DEFAULT"
    ? messages[canonical]
    : undefined;
};

/** Resolves text on every render; never cache text across language changes. */
export function getNotificationText(
  type: unknown,
  rawPayload?: unknown,
  t: Translator = translate,
): NotificationText {
  const payload =
    rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
      ? (rawPayload as Record<string, unknown>)
      : {};
  const code = identifier(type);
  const status = identifier(payload.status);
  const mapped =
    (code === "RIDE_UPDATED" && status === "SEARCHING" && typeof payload.redispatchCount === "number" && payload.redispatchCount > 0 ? messages.RIDE_REDISPATCHED : undefined) ??
    (["RIDE_UPDATED", "RIDE_NO_DRIVER"].includes(code) && rideStatuses.has(status)
      ? lookup(status)
      : undefined) ?? lookup(type);
  if (mapped)
    return { title: t(mapped.title), description: t(mapped.description) };

  // Preserve meaningful free-form announcements, but never dump transport fields,
  // enum tokens, or stock backend event names as user-facing prose.
  for (const key of ["message", "body", "description", "content", "note"]) {
    const value = payload[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const text = value.trim();
    const known = lookup(text);
    if (known)
      return { title: t(known.title), description: t(known.description) };
    if (
      /^[A-Z][A-Z0-9_]*$/.test(text) ||
      /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/.test(text)
    )
      continue;
    return { title: t(messages.DEFAULT.title), description: t(text) };
  }
  return {
    title: t(messages.DEFAULT.title),
    description: t(messages.DEFAULT.description),
  };
}
