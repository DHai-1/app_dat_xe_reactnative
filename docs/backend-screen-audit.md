# Rà soát kết nối màn hình — 30/10/2026

Project áp dụng: D:\datxe_rn. Đối chiếu controller/DTO/service tại D:\datxebackend. Không thay hợp đồng API backend, không sửa .env/key.

## Customer — từng route

| Route | Nguồn dữ liệu / tác vụ thực |
|---|---|
| index, index.web | Firebase/session; web về đăng nhập, không tài khoản mẫu |
| (auth)/login | Firebase OTP/Google/Facebook → /auth/customer/login |
| (auth)/register | Firebase xác minh → /auth/customer/register |
| (auth)/otp-verify | Firebase OTP → backend login/register |
| (auth)/add-phone-number | Firebase liên kết số → đồng bộ backend login |
| (tabs)/home | /customer/profile, rides/active, rides, vouchers, notifications/unread-count, location/customer/nearby-drivers; GPS thật |
| (tabs)/history | /customer/rides, phân trang + lọc trạng thái |
| (tabs)/notifications | /notifications + read/read-all, số chưa đọc |
| (tabs)/profile | Profile, số chuyến/xe/voucher thật; avatar signed upload; logout/delete thật |
| edit-profile | GET/PUT /customer/profile, validation form |
| payment-methods | GET/PUT /customer/profile.default_payment_method; chỉ CASH |
| ride/route-selection | Điều phối draft đặt xe; không dữ liệu mẫu |
| ride/pickup | /location/places/search + detail; GPS và địa điểm đã lưu thật |
| ride/destination | Cùng dịch vụ địa chỉ, giữ tọa độ chính xác |
| ride/map-picker | Pin thật + /location/places/reverse khi map dừng |
| ride/vehicle | /customer/vehicles; kiểm tra rides/active |
| ride/confirm | /customer/rides/estimate + POST rides; voucher server; routeQuoteId, idempotency key |
| ride/find-driver | GET ride theo ID; POST cancel |
| ride/tracking | GET ride theo ID + STOMP vị trí; tuyến đã lưu; không vị trí tài xế mẫu |
| ride/[id] | Chi tiết/status history/handover từ backend |
| ride/completed | Giá/biên bản từ ride; POST rating. Chỉ hiện dấu hoàn tất khi status COMPLETED |
| vehicles | GET/DELETE /customer/vehicles |
| add-vehicle | POST/PUT vehicle; signed upload và CRUD images |
| vehicle-inspection | GET ride + POST customer handover confirm |
| vouchers | GET /customer/vouchers; áp dụng qua estimate |
| chat | GET/POST /chat/rides/:id/messages, read, upload ảnh signed |
| support | Chuyến đang hoạt động, chat và lịch sử; hiển thị lỗi tải thay vì báo nhầm không có chuyến |
| terms-of-service | Nội dung tĩnh tại app, không giả dữ liệu backend |
| privacy-policy | Nội dung tĩnh tại app, không giả dữ liệu backend |
| settings/index | Điều hướng nhóm cài đặt |
| settings/[section]: appearance | Theme/ngôn ngữ cục bộ trên thiết bị, đúng bản chất preference |
| settings/[section]: notifications | Quyền thông báo thực + mở cài đặt hệ thống; gỡ công tắc lọc theo loại chưa có backend xử lý |
| settings/[section]: permissions | Quyền location/camera/notifications thực của OS |
| settings/[section]: places | Search/detail backend; dữ liệu đã lưu cục bộ theo UID, ghi rõ trên thiết bị này |
| Hồ sơ: Thông tin cá nhân / quản lý tài khoản | Sửa profile qua /edit-profile; logout và DELETE /auth/account chỉ còn ở cuối Hồ sơ. Màn /settings/account đã gỡ. |
| settings/[section]: about | Phiên bản từ expo-constants; điều hướng legal/support |

## Driver — từng route

| Route | Kết quả |
|---|---|
| index, index.web | Firebase/backend session; web đăng nhập |
| (auth)/login | Firebase → /auth/driver/login, giữ luồng thật |
| (auth)/register | Firebase → /auth/driver/register, giữ luồng thật |
| (auth)/otp-verify | OTP thật, giữ luồng thật |
| (auth)/license-upload | Thay form mẫu bằng GET profile/documents/skills, signed DRIVER_DOCUMENT upload, POST documents, PUT profile/skills; GPLX mặt trước DRIVER_LICENSE, mặt sau DRIVER_LICENSE_BACK |
| (auth)/verify-id | CCCD, CCCD_BACK, SELFIE upload thật + POST documents; bỏ tên/số/ảnh mẫu, bỏ khẳng định đối sánh sinh trắc học giả |
| (auth)/approval-status | GET verification/documents; trạng thái/rejection_reason từ server, refresh; bỏ bộ chọn trạng thái giả |
| (tabs)/home | /auth/me, driver verification, active ride, pending offer, PUT availability; STOMP đang có cập nhật query. Bỏ ảnh map/heatmap giả, khu vực ưu tiên, auto accept không có tác dụng, thành tích mẫu, hotline chưa xác thực |
| (tabs)/history | GET /driver/rides phân trang; mở ride thật theo ID, không danh sách TRIPS mẫu |
| (tabs)/notifications | GET /notifications; PUT read/read-all; không ITEMS mẫu và không chỉ đánh dấu cục bộ |
| (tabs)/profile | Auth identity thật + /driver/profile, /driver/verification, /driver/wallet; giao dịch ví thật, liên kết chuyến. Không số dư giả, ngân hàng giả, rút tiền giả, bảo hiểm/thành tích mẫu |
| ride/accept | Pending offer/accept/reject API thật, expiresAt thật; địa chỉ/note/giá từ offer |
| ride/in-progress | Active ride + progress endpoints; bàn giao + chỉ đường ngoài. Sau complete điều hướng với ID chuyến thực |
| ride/vehicle-inspection | Active ride + camera/upload HANDOVER + POST report. Xóa ảnh/form cũ khi đổi chuyến/pha để không dùng lại ảnh sai |
| ride/handover | Route alias tới cùng màn bàn giao thật |
| ride/complete | GET /driver/rides/:id; giá, status history, ảnh bàn giao thật. POST cash/confirm chỉ khi người dùng xác nhận nhận tiền. Không giả thu nhập, đánh giá khách, thanh toán ví hoặc tìm cuốc bằng timer |

## Dọn bỏ

- Xóa packages/ui/src/mocks/index.ts và mocks/auth.ts. Chỉ giữ cấu hình menu/icon/màu thực sự dùng trong profileMenu.ts; bỏ subtitle/badge xe, voucher và MoMo giả.
- Xóa 13 file hooks/components driver cũ không còn được dùng, chứa ảnh/người/biển số/thống kê mẫu.
- Bỏ thông tin triển khai backend thừa khỏi nội dung màn customer, giữ lỗi/thông báo phù hợp với người dùng.
- Bộ test vẫn dùng fixture/mocked transport để kiểm tra hợp đồng, không tham gia bundle ứng dụng.

## Giới hạn backend còn lại

- Không có endpoint rút tiền, tài khoản ngân hàng, bảng xếp hạng, hiệu suất 30 ngày, bảo hiểm, vùng ưu tiên, heatmap hoặc auto accept: đã gỡ UI hứa hẹn chức năng chưa thực hiện được.
- Không có endpoint đồng bộ saved places/preferences hay filter gửi push theo loại: giữ saved places thực trên thiết bị; gỡ công tắc lọc giả. Không tự thêm API/migration do yêu cầu trước đó cần đề xuất trước khi đổi hợp đồng.
- Không có endpoint đọc payment status trong ride detail: không tự khẳng định đã/chưa thu tiền; chỉ hiển thị PAID sau phản hồi cash/confirm. Endpoint idempotent và từ chối chuyến không dùng CASH.
- Không có API đọc đánh giá khách trên màn driver: bỏ đánh giá mẫu, không suy diễn xếp hạng.
- Không có hotline/SOS server: bỏ số điện thoại mẫu.
- Không thay label địa danh nhà cung cấp bản đồ hay dịch nội dung người dùng.

## Kiểm thử và vận hành

Chạy npm run check (architecture + tất cả typecheck + lint + tests). Tests bổ sung: số/expiry giấy tờ, không gửi lại giấy tờ không đổi, sửa metadata dùng đúng ảnh sở hữu thật, path/method phân trang/ví/read notifications, scope signed upload, field name document và cash receipt.

Chưa chạy end-to-end với tài khoản Firebase trên máy thật. Probe backend localhost:8080 (cổng application.properties) không kết nối được ở lần kiểm tra này. Vì vậy việc đối chiếu source và test adapter không được coi là đã xác nhận API live/DB/Cloudinary hoạt động.

Khi backend chạy: đăng nhập driver mới → gửi GPLX/CCCD/ảnh chân dung → admin duyệt docs/skills/verification → online → customer đặt chuyến → accept → xác nhận hai pha bàn giao → complete → xác nhận tiền mặt sau khi thực nhận → xem lịch sử/ví/thông báo. Thử mất mạng và tài khoản chưa có dữ liệu để bảo đảm không thấy số liệu mẫu. Không tạo chuyến, xác nhận tiền hoặc xóa tài khoản thật chỉ để thử tự động.

Kết quả cuối: npm run check đạt; TypeScript toàn workspace, lint customer/driver không lỗi/cảnh báo, kiểm tra kiến trúc và 50 tests đều đạt.
