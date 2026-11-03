# Screenshots — App tài xế

Chụp từ development build `com.datxe.driver` trên Android thật (1080×2400, chế độ tối),
tài khoản tài xế #2 đang đăng nhập và đang bật nhận chuyến.
Điều hướng bằng deep link `drivemate-driver://<route>` rồi `adb screencap`.

| Tệp | Route | Ghi chú |
| --- | --- | --- |
| 01-login.png | `/login` | Đăng nhập tài xế |
| 02-register.png | `/register` | Đăng ký đối tác tài xế |
| 03-otp-verify.png | `/otp-verify?phone=0912345678` | Nhập OTP |
| 04-verify-id.png | `/verify-id` | CCCD + ảnh chân dung |
| 05-license-upload.png | `/license-upload` | Giấy phép lái xe, hạng bằng, loại xe |
| 06-approval-status.png | `/approval-status` | Xét duyệt hồ sơ (đã duyệt, còn 1 kỹ năng chờ) |
| 07-home.png | `/home` | Trang chủ: đang ONLINE, danh sách kỹ năng theo trạng thái duyệt |
| 08-history.png | `/history` | Tab Lịch sử |
| 09-notifications.png | `/notifications` | Tab Thông báo |
| 10-profile.png | `/profile` | Tab Hồ sơ |
| 11-ride-accept.png | `/ride/accept` | Chi tiết yêu cầu nhận chuyến (chưa có offer) |
| 12-ride-in-progress.png | `/ride/in-progress` | Chuyến đang thực hiện (chưa có chuyến) |
| 13-ride-complete.png | `/ride/complete?rideId=7` | Hoàn tất chuyến (chuyến test của khách, không thuộc tài xế) |
| 14-ride-handover.png | `/ride/handover` | Bàn giao xe (chưa có chuyến) |
| 15-ride-vehicle-inspection.png | `/ride/vehicle-inspection` | Kiểm tra xe trước chuyến (chưa có chuyến) |

Lưu ý: icon bánh răng nổi ở góc là nút menu dev của Expo dev client, không phải UI của app.
Tài xế #2 chưa từng nhận chuyến nào nên các màn 11–15 hiển thị trạng thái trống; muốn có ảnh
đầy đủ dữ liệu cần tạo một chuyến và gán cho tài xế trước khi chụp.
