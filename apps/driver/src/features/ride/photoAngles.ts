export const PHOTO_ANGLES = [
  ["FRONT", "Đầu xe"],
  ["BACK", "Đuôi xe"],
  ["LEFT", "Bên trái"],
  ["RIGHT", "Bên phải"],
  ["DASHBOARD", "Đồng hồ (tùy chọn)"],
] as const;

export function photoAngleLabel(angle: string) {
  return PHOTO_ANGLES.find(([value]) => value === angle)?.[1] ?? "Ảnh bàn giao";
}
