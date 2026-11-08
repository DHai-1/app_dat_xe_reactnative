# Điều phối tuần tự: đối chiếu và vận hành

Phạm vi: backend `datxebackend`, Driver và Customer. PostgreSQL quyết định kết quả cuối cùng; Redis giữ vị trí, khóa và trạng thái tạm. Phạm vi phục vụ giữ nguyên theo yêu cầu; chưa áp đặt geofence mới.

## Đối chiếu luồng trước và sau

| Cơ chế | Trước | Sau |
| --- | --- | --- |
| Vòng tìm | 2 → 4 → 7 → 10 km, kết thúc khi hết vòng | 2 → 3 → 5 km; tiếp tục quét ở bán kính cuối đến hạn 90 giây |
| Danh sách ứng viên | Tối đa 20/vòng | Top 5 sau lọc hồ sơ/loại xe/khả dụng; giới hạn quét riêng 500 để nhóm tài xế không phù hợp không chiếm hết top 5 |
| Thời gian offer | 15 giây | Server 12 giây; giao diện dùng mốc server trừ 2 giây; timeout có grace 1 giây |
| Tính duy nhất offer | Chủ yếu rideId và driverId | UUID offerId, khóa NX/PX theo tài xế, current_offer có TTL; ledger DB có unique index cho ride và driver đang được mời |
| Job bền vững | Outbox khởi động tìm; hết ứng viên không quét lại | Outbox PostgreSQL làm delayed queue: available_at, lease, revision và claim_token; worker cũ không được xác nhận/xóa lịch mới |
| Trạng thái chuyến | Nhận chuyến có conditional update; các nhánh khác dùng optimistic version | Chuyển trạng thái có CAS theo trạng thái/version; nhận chuyến kiểm tra cả hạn tìm và ledger offer còn hiệu lực |
| Nhận/hủy đồng thời | Có nền tảng CAS khi nhận | DB quyết định người thắng; nhận thất bại bù trừ Redis; offer/job cũ bị chặn theo token/generation |
| Hết ứng viên | Báo không có tài xế ngay | Lên lịch quét lại 3 giây, giữ người đã thử; tài xế mới online có thể tham gia vòng sau |
| Gửi thông báo lỗi | Có thể thu hồi ngay khi WS và FCM không gửi được | WS/FCM chạy song song, có deadline và hàng đợi giới hạn; offer vẫn có qua REST polling |
| Redis restart | Có thể đưa tài xế đang có chuyến trở lại pool vì thiếu Redis key | GPS kiểm tra chuyến/offer trong DB; reconciler dựng lại BUSY từ chuyến thật và sửa khóa mồ côi |
| Tài xế hủy trước đón | Kết thúc chuyến | Tìm lại tối đa 2 lần ở DRIVER_ASSIGNED/DRIVER_ARRIVING; tăng generation, đặt deadline mới, không hỏi lại người đã thử |
| Mất liên lạc trước đón | Chủ yếu can thiệp thủ công | Sau 60 giây xử lý tìm lại có giới hạn; có thời gian chờ sau khi server khởi động để GPS phục hồi |
| Bỏ qua liên tiếp | Chưa có chính sách trong lựa chọn | Ledger IGNORED và điểm phạt sau ngưỡng cấu hình; không tự tắt tài xế |
| Lỗi Redis/dispatch kéo dài | Retry, có thể mắc kẹt | Retry qua queue, quá ngưỡng chuyển FAILED_SYSTEM; DB không truy cập được thì lease/reconciler phục hồi sau |
| Đặt trùng | Khóa khách và receipt DB | Giữ receipt bền vững với cửa sổ idempotency 5 phút; thêm partial unique index active customer/driver; 409 có rideId hiện có |

## Tên trạng thái và khóa giữ tương thích

- `SEARCHING` tương ứng `FINDING_DRIVER`; `DRIVER_ASSIGNED` tương ứng `ACCEPTED`.
- `NO_DRIVER_FOUND` tương ứng `CANCELLED_NO_DRIVER`; `CANCELLED` dùng `cancelled_by_role` để phân biệt phía hủy. Bổ sung trạng thái terminal `FAILED_SYSTEM` và nhãn Việt/Anh.
- Giữ GEO `available_drivers`, khóa `driver:{id}:lock` và heartbeat `driver:alive:{id}` để dùng chung với tracking/admin hiện tại. Khóa offer dùng NX/PX; `ride:{id}:current_offer` giữ `driverId:offerId`. Thêm ZSET `drivers:lastseen`.
- `ride_dispatch_offers` lưu người đã được thử và offer đang chờ qua cả Redis restart. Redis rejected TTL hết không làm người đã từ chối được hỏi lại trong cùng ride.
- Queue PostgreSQL thay vai trò BullMQ/Quartz; không đưa thêm dịch vụ vận hành. Tick kiểm tra DB trước khi làm việc, có khóa Redis theo ride; ack/retry được ràng buộc với revision + token.

## Cấu hình

Các biến môi trường được ánh xạ trong `application.properties`, kiểm tra hợp lệ trong `MatchingProperties`:

| Biến | Mặc định |
| --- | --- |
| MATCHING_OFFER_TTL | 27s (25s trên app, 2s dự phòng) |
| MATCHING_SEARCH_TIMEOUT | 90s |
| MATCHING_RADIUS_STEPS | 2,3,5 |
| MATCHING_TOP_N | 5 |
| MATCHING_RANKING_MODE | DISTANCE (hoặc SCORE) |
| SERVICE_AREA_ENABLED | true |
| SERVICE_AREA_CENTER_LAT / LNG | 21.0285 / 105.8542 |
| SERVICE_AREA_RADIUS_KM | 50 |
| MATCHING_RESCAN_DELAY | 3s |
| MATCHING_LOCATION_STALE | 30s |
| MATCHING_MAX_REDISPATCH | 2 |
| MATCHING_OFFER_GRACE | 1s |
| MATCHING_CLIENT_OFFER_GRACE | 2s |
| MATCHING_REJECTED_TTL | 120s |
| RIDE_IDEMPOTENCY_TTL | 5m |
| MATCHING_DRIVER_DISCONNECT_TIMEOUT | 60s |
| MATCHING_CANDIDATE_SCAN_LIMIT | 500 |
| MATCHING_IGNORED_THRESHOLD / PENALTY / WINDOW | 3 / 20 / 30m |
| NOTIFICATION_DELIVERY_TIMEOUT_MS | 2000 |
| RIDE_DISPATCH_RECOVERY_INTERVAL_MS | 10000 |

## API và app

`POST /api/driver/offers/{rideId}/accept` và `/reject` nhận body `{ "offerId": "UUID đã hiển thị" }`. Pending offer thêm `offerId`, `serverTime`, `clientExpiresAt`; `expiresAt` vẫn là hạn server. Offer hết hạn trả 410; Lua thành công nhưng DB không còn cho nhận trả 409 `RIDE_NO_LONGER_AVAILABLE`. Retry nhận chuyến đã được gán đúng tài xế trả thành công.

Payload `RIDE_ASSIGNED` bổ sung `licensePlate` và `etaToPickupMin`. Offer hết hạn/hủy được gửi cả push để tài xế ở nền vẫn đóng được thông báo. Driver đếm thời gian còn lại từ dữ liệu server tương đối với lúc nhận response; đồng hồ điện thoại không quyết định quyền nhận chuyến. Customer quay lại màn tìm tài xế khi ride trở về SEARCHING và có thông báo “Đang tìm tài xế khác”. REST active/detail/pending vẫn là đường phục hồi khi bỏ lỡ push/WebSocket.

## Kiểm thử và cập nhật

- Frontend: `npm run check` (architecture, TypeScript, lint, toàn bộ tests); `tests/sequential-dispatch.test.cjs` kiểm tra offerId, cửa sổ đếm ngược và nội dung tìm lại/lỗi hệ thống.
- Backend: Gradle test cho matching, notification và GPS; `DispatchPersistenceTests` cần `TEST_DB_URL`, `TEST_DB_USER`, `TEST_DB_PASSWORD` trỏ **DB thử nghiệm**. Mỗi test tạo schema riêng, áp dụng toàn bộ migration và xóa schema sau test. Kiểm tra queue fencing, unique offer, CAS nhận/hủy, hạn offer/search và receipt idempotency.
- `python3 -m unittest discover -s src/test/python -v`: thực thi Lua sản xuất với Redis fixture trong bộ nhớ, cần liblua5.4. Bao gồm token/TTL, hai ride tranh driver, rollback, offer cũ và GPS không đưa BUSY/OFFERED lại GEO.
- Migration `V15__sequential_dispatch.sql` thêm deadline/generation, ledger offer và các unique index. Trước cập nhật cần kiểm tra dữ liệu active trùng; migration sẽ từ chối thay vì tự hủy dữ liệu thật.
- Cập nhật đồng bộ backend và Driver vì accept/reject mới bắt buộc offerId. Customer cần bản mới để hiển thị FAILED_SYSTEM và chuyển màn khi tìm lại. Với rolling deployment cần dừng nhận booking trong thời gian chuyển phiên bản/drain các offer cũ.
- Chưa triển khai lên môi trường thật, chưa kiểm thử end-to-end trên hai điện thoại trong đợt sửa này. Cần kiểm tra nhận/từ chối, hủy sát lúc nhận, tài xế mới online giữa vòng tìm, Redis restart và app nền trên staging.

Các lựa chọn nghiệp vụ giữ nguyên: chưa có geofence mới, không thêm phí hủy, không tự chuyển OFFLINE khi bỏ qua. Không có PostGIS fallback trong dự án; lỗi dispatch kéo dài dùng FAILED_SYSTEM. Redis fixture không thay thế stress test Redis thật.

## Kết quả xác minh đợt sửa

- `npm run check`: đạt, 24 file test frontend cùng architecture, typecheck và lint.
- Backend (Gradle 9.6.0 có sẵn trên máy): 70 test được thu thập, 69 đạt, 1 PlaceSearch test bỏ qua theo điều kiện môi trường. Tất cả `DispatchPersistenceTests` chạy với PostgreSQL tạm trên localhost, gồm áp dụng toàn bộ migration.
- `DatxebackendApplicationTests.contextLoads` được loại riêng khỏi đợt chạy nghiệp vụ: cần cấu hình datasource/Firebase/Redis đầy đủ; không coi kiểm thử context hoặc end-to-end này đã đạt.
- Lua: 10 test đạt với liblua5.4 và Redis fixture. Đã dừng PostgreSQL tạm sau kiểm thử. Không thay đổi dữ liệu hay triển khai lên môi trường thật.
