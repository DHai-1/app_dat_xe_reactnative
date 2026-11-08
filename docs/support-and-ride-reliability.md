# Hỗ trợ, điều chỉnh biên bản và độ tin cậy chuyến đi

Triển khai F03–F08 ngày 05/11/2026 trong frontend và `D:\datxebackend`.

## Backend và thứ tự cập nhật

Backend cũ chưa có hỗ trợ/điều chỉnh biên bản; đã bổ sung migration `V14__support_and_handover_revisions.sql`. Cập nhật backend và để Flyway chạy thành công trước khi phát hành hai app. Không sửa các migration đã chạy trước đó. Thay đổi này mới được kiểm tra ở source và schema thử nghiệm, chưa triển khai lên server đang phục vụ người dùng.

API chi tiết chuyến của Customer/Driver nay có `payment: { amount, method, status, paidAt } | null`. Thanh toán chỉ được tạo khi hoàn tất chuyến; `null` không được hiểu là chưa thu tiền. API xác nhận tiền mặt hiện có chỉ chuyển `PENDING → PAID`, cho phép retry khi đã `PAID`, giữ `paidAt` cũ và kiểm tra đúng tài xế/phương thức/trạng thái chuyến.

## Kênh hỗ trợ chính thức

Customer mở Trợ giúp/An toàn; Driver mở Hồ sơ → Trợ giúp. Biên bản hai app có nút hỗ trợ gắn sẵn chuyến. Người dùng có thể chọn chuyến của mình, loại vấn đề, nhập mô tả 10–4000 ký tự, đính kèm tối đa 5 ảnh. Upload dùng chữ ký `purpose=SUPPORT`, kiểm tra Cloudinary URL/publicId thuộc tài khoản gửi. Danh sách chuyến/yêu cầu có phân trang.

| API | Quyền / hành vi |
| --- | --- |
| `POST /api/support/tickets` | Customer/Driver; `clientRequestId` UUID, `rideId?`, `category`, `description`, `images: [{fileUrl, publicId}]`. Trả mã `HT-{id}`; retry cùng UUID không tạo yêu cầu/ảnh trùng. |
| `GET /api/support/tickets?page=0` | 20 yêu cầu mới nhất/trang, chỉ đúng chủ và role. |
| `GET /api/support/tickets/{id}` | Đọc lại yêu cầu sau khi mở app lại. |
| `GET /api/admin/support/tickets?page=0&status=OPEN` | Hàng đợi tiếp nhận của ADMIN; có thể bỏ filter status. |
| `GET /api/admin/support/tickets/{id}` | ADMIN xem nội dung, ảnh, chủ yêu cầu. |
| `PATCH /api/admin/support/tickets/{id}` | ADMIN gửi `{status, response}`; trạng thái `OPEN`, `IN_PROGRESS`, `RESOLVED`. Khi `RESOLVED` bắt buộc có phản hồi; lưu admin xử lý và thời điểm cập nhật. |

App hiển thị trạng thái/ảnh/phản hồi thật và tải lại mỗi 30 giây khi màn hoạt động; có nút tải lại thủ công. Nhân viên có thể dùng API quản trị qua Swagger với tài khoản ADMIN. Repository mobile này chưa chứa dashboard hỗ trợ cho nhân viên; không thêm email/hotline giả. Cần phân công người trực và thống nhất thời gian phản hồi trước khi quảng bá dịch vụ hỗ trợ. Kênh hỗ trợ không phải SOS; chưa có quy trình vận hành khẩn cấp nên không hứa cứu hộ hoặc tạo nút khẩn cấp giả.

## Biên bản có phiên bản

Mỗi biên bản hiện tại có `revision`, `correctionReason`, `correctionImages` và `confirmedByCustomer`. Khi chưa đồng ý, khách chọn **Thông tin không đúng**, nhập lý do 10–2000 ký tự và ảnh tùy chọn. Chỉ chủ chuyến được yêu cầu, đúng bước bàn giao và trước khi xác nhận.

| API | Body / kết quả |
| --- | --- |
| `POST /api/customer/rides/{id}/handover/{pickup\|dropoff}/corrections` | `{revision, reason, images}`; giữ nội dung hiện tại và chuyển sang chờ sửa. |
| `POST /api/driver/rides/{id}/handover/{pickup\|dropoff}/revisions` | `{revision, report: {odometer, fuelLevel, notes, photos}}`; chỉ tài xế được gán, khi có yêu cầu sửa. Lưu snapshot đầy đủ bản cũ/lý do/ảnh báo sai lệch, tăng phiên bản, xóa yêu cầu đang chờ và chờ khách kiểm tra lại. |
| `GET /api/{customer\|driver}/rides/{id}/handover/{pickup\|dropoff}/revisions` | Các phiên bản cũ, chỉ người tham gia; có ảnh và lý do để đối chiếu. |
| API `.../confirm` hiện có | Gửi `{confirmed:true, revision}`; backend từ chối phiên bản cũ hoặc biên bản đang chờ sửa. Client cũ mặc định revision 1, không tự xác nhận bản đã sửa. |

Khóa ride cùng optimistic version của report bảo vệ request đồng thời với xác nhận/tiến trình chuyến. Biên bản pickup chỉ điều chỉnh tại `VEHICLE_HANDOVER`, dropoff tại `VEHICLE_RETURNED`; không sửa hồi tố sau khi đã xác nhận/chuyến đã qua bước. Những trường hợp đó chuyển sang hỗ trợ. Driver cập nhật số km/nhiên liệu/ghi chú và chụp bộ ảnh cần thiết; bản cũ vẫn xem được. Màn biên bản hai bên tải lại mỗi 5 giây; không phụ thuộc duy nhất vào push để nhận yêu cầu điều chỉnh.

## Home, trạng thái nhận chuyến và GPS

- Customer: **Thử tải dữ liệu** refetch đúng các query bị lỗi; nút định vị chỉ xử lý GPS. React Query giữ dữ liệu cũ khi refetch lỗi.
- Driver: thẻ thường trực trên các màn dùng `DriverPage` phân biệt session đã bật online với realtime/GPS sẵn sàng. Hiện kết nối, quyền/dịch vụ GPS, thời điểm đo, quyền/chia sẻ nền, lỗi và nút thử lại/mở cài đặt. GPS/đã gửi quá 30 giây không được coi sẵn sàng. Trạng thái này phản ánh điều kiện trên thiết bị, không bảo đảm server sẽ ghép offer.
- Driver chạy chia sẻ vị trí nền cả khi online chờ chuyến, và dừng khi offline không có chuyến. Có kiểm tra lại quyền/dịch vụ khi quay về app và định kỳ; dữ liệu background xác minh lại tài khoản/online/chuyến. Nếu không có quyền nền, hiển thị rõ cần giữ app mở.
- Cache lưu cả thời điểm GPS đo thật; cache cũ thiếu timestamp hoặc quá 30 giây không được phát lại như mới. Heartbeat yêu cầu mẫu vị trí thật, không gắn `Date.now()` lên tọa độ cũ. Hủy tác vụ đang chờ khi dừng chia sẻ.
- Server bắt buộc có timestamp đo; tách `receivedAt` do server thêm. Chỉ gia hạn khả dụng ghép chuyến với mẫu còn trong 30 giây; TTL không vượt quá phần thời gian còn mới của mẫu.
- Customer xét cả thời điểm đo và tình trạng kết nối; frame vừa nhận không làm mẫu GPS cũ trở thành cập nhật trực tiếp.

## Kiểm tra lỗi không nhận chuyến / không có tài xế trên map

- WebSocket kết nối chưa đủ: backend chỉ đưa tài xế ONLINE vào `available_drivers` khi có mẫu GPS còn mới trong 30 giây, không có khóa offer/chuyến. Map khách chỉ hiển thị tài xế khả dụng trong bán kính 3 km; matching mặc định mở rộng lần lượt 2/3/5 km, quét lại đến hạn tìm tổng 90 giây và còn lọc loại xe, hồ sơ, bằng lái.
- Driver khởi động foreground GPS độ chính xác cao, lấy vị trí ngay và chạy heartbeat trước khi chờ quyền/service nền. Quyền nền bị từ chối, treo hoặc API không hỗ trợ không chặn foreground GPS. Mẫu có `accuracy: null` vẫn hợp lệ theo API; không giả lập độ chính xác hoặc đổi timestamp cũ.
- Customer hiển thị lỗi query nearby qua vùng lỗi/thử lại của Home; màn tracking ẩn số độ chính xác nếu thiết bị không cung cấp.
- Backend `DispatchScripts.RELEASE`, `CANCEL_SEARCH`, `ROLLBACK_ACCEPT` dùng khóa heartbeat chuẩn `driver:alive:{id}`. Khóa cũ `driver:{id}:alive` khiến tài xế khỏe bị chuyển OFFLINE sau thu hồi lời mời.
- Hồi quy frontend: `tests/driver-gps-startup.test.cjs`, `tests/live-location.test.cjs`, `tests/support-ride-reliability.test.cjs`. Hồi quy backend: `python3 -m unittest discover -s src/test/python -v` (thực thi Lua thật với fixture Redis trong bộ nhớ, cần thư viện hệ thống Lua 5.4; không thay thế integration Redis).
- Cần cập nhật cả app và backend để áp dụng đủ bản sửa. Sau cập nhật, giữ Driver mở, bật nhận đúng loại xe và xác nhận GPS có mẫu mới; Customer ở trong 3 km cần chờ lượt refresh nearby tối đa 30 giây. Kiểm tra thêm từ chối/hết hạn offer rồi nhận chuyến tiếp theo bằng tài khoản thử nghiệm.

## Kiểm chứng và QA còn cần

Kết quả đã chạy: `npm run check` đạt architecture/typecheck/lint và **106/106 test frontend**. Hồi quy backend đạt **58 test**, **1 test gọi nhà cung cấp thật được skip theo cấu hình**; không chạy test khởi động toàn Spring context. Trong đó 4 test PostgreSQL thật kiểm tra migration/support/payment trong schema rollback. Export Android Customer và Driver qua Metro/Hermes đều thành công; lần export trong sandbox ban đầu bị chặn ghi file tạm, chạy lại ngoài sandbox đã qua.

Test tự động kiểm tra retry dữ liệu, khôi phục payment, version khi xác nhận/sửa, UUID support retry, chờ upload ảnh, chỉ báo online, cache và timestamp GPS cũ. Backend kiểm tra phân quyền, snapshot/phiên bản, chặn xác nhận cũ, TTL vị trí. Test PostgreSQL chạy toàn bộ migration trong schema riêng, rollback sau từng test; kiểm tra mã tiếp nhận bền vững, chống gửi lặp/ảnh trùng, phản hồi quản trị và thu tiền lặp. Không sửa dữ liệu hiện có.

Chưa QA trực quan/E2E Android/iOS: hai tài khoản báo sai → sửa → xác nhận → bắt đầu/hoàn tất; mạng đứt sau server commit; gửi ảnh lỗi; app restart; thay đổi quyền GPS; chuyển app/khóa màn hình khi online hoặc có chuyến. Nội dung giải thích quyền vị trí iOS được cập nhật trong app config, cần native build mới để đổi lời nhắc hệ thống. Thiết lập nền phụ thuộc hệ điều hành và chính sách tiết kiệm pin.
