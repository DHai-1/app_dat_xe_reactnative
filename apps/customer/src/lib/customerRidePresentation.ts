export const rideStatusLabel: Record<string, string> = {
  PENDING: "Đang tiếp nhận yêu cầu",
  SEARCHING: "Đang tìm tài xế",
  DRIVER_ASSIGNED: "Tài xế đã nhận chuyến",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
  VEHICLE_HANDOVER: "Đang bàn giao xe",
  IN_PROGRESS: "Chuyến đi đang diễn ra",
  ARRIVED_DESTINATION: "Đã đến điểm trả",
  VEHICLE_RETURNED: "Đang hoàn tất bàn giao xe",
  COMPLETED: "Chuyến đi hoàn thành",
  CANCELLED: "Chuyến đi đã hủy",
  FAILED_SYSTEM: "Không thể tìm tài xế do lỗi hệ thống",
  NO_DRIVER_FOUND: "Không tìm thấy tài xế",
  EXPIRED: "Yêu cầu đã hết hạn",
};

export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];
