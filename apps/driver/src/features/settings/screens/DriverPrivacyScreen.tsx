import { DriverPage } from "@/components/DriverPage";
import { Card, SectionHeading, Typography } from "@datxe/ui";

export default function DriverPrivacyScreen() {
  return (
    <DriverPage title="Quyền riêng tư trên ứng dụng" backFallback="/(auth)/login">
      <SectionHeading title="Đăng nhập và giấy tờ" />
      <Card>
        <Typography>Số điện thoại đã xác minh giúp nhận diện tài khoản. Ảnh giấy phép, căn cước và ảnh chân dung bạn gửi được dùng để xét duyệt hồ sơ tài xế.</Typography>
      </Card>
      <SectionHeading title="Vị trí và thông báo" />
      <Card>
        <Typography>Ứng dụng dùng vị trí để điều phối khi bật nhận chuyến và chia sẻ vị trí trong chuyến đang hoạt động. Quyền vị trí nền cho phép tiếp tục gửi vị trí khi bạn chuyển ứng dụng. Bạn có thể quản lý vị trí và thông báo trong cài đặt thiết bị.</Typography>
      </Card>
      <SectionHeading title="Quản lý tài khoản" />
      <Card>
        <Typography>Mở Hồ sơ để xem và sửa thông tin liên hệ hoặc yêu cầu xóa tài khoản. Một số lịch sử chuyến và giao dịch có thể được giữ lại để đối chiếu.</Typography>
      </Card>
    </DriverPage>
  );
}
