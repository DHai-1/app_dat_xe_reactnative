import { DriverPage } from "@/components/DriverPage";
import { Card, SectionHeading, Typography } from "@datxe/ui";

export default function DriverLoginHelpScreen() {
  return (
    <DriverPage title="Trợ giúp đăng nhập" backFallback="/(auth)/login">
      <SectionHeading title="Chưa nhận được mã SMS" />
      <Card>
        <Typography>Kiểm tra số điện thoại và sóng di động. Khi hết thời gian chờ, chọn Gửi lại mã và nhập mã mới nhất.</Typography>
      </Card>
      <SectionHeading title="Đăng nhập bằng Google hoặc Facebook" />
      <Card>
        <Typography>Chọn lại đúng tài khoản đã dùng trước đây. Khi được yêu cầu, hãy xác minh số điện thoại để tiếp tục tạo hồ sơ tài xế.</Typography>
      </Card>
      <SectionHeading title="Bảo mật tài khoản" />
      <Card>
        <Typography>Không chia sẻ mã OTP. Sau khi đăng nhập, mở Hồ sơ → Trợ giúp để gửi yêu cầu có mã tiếp nhận.</Typography>
      </Card>
    </DriverPage>
  );
}
