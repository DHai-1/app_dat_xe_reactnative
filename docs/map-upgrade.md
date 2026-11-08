# Map Việt Nam: routing, tuyến đã lưu và GPS trực tiếp

## Các thay đổi hợp đồng API (chỉ bổ sung)

| API | Trường mới |
| --- | --- |
| `GET /api/location/directions` | query `vehicleType=CAR\|MOTORCYCLE`, mặc định CAR để giữ client cũ |
| `POST /api/customer/rides/estimate` | request `routeQuoteId?`; response `route` gồm id, polyline, polylinePrecision=6, coordinates, distanceMeters, durationSeconds, provider, vehicleType, limitation, expiresAt |
| `POST /api/customer/rides` | request `routeQuoteId?`, `pickupNote?` tối đa 500 ký tự; response bổ sung `route` |
| `GET /api/customer/rides/{id}`, `/api/driver/rides/{id}`, `/active` | response bổ sung `route?`, `pickupNote?`; ride cũ có thể chưa có tuyến |
| Offer qua HTTP/STOMP | bổ sung `pickupNote?`; distance/ETA chuyến đọc từ ride đã lưu |
| STOMP `/app/location` → `/user/queue/rides/{rideId}/location` | giữ `location:{lat,lng}`, thêm `timestamp` ISO UTC và `accuracy` mét; server thêm `receivedAt`. Client mới gửi đủ timestamp/accuracy; server vẫn nhận mẫu cũ không có accuracy để tương thích |

Backend lấy loại xe từ phương tiện thuộc khách; không tin loại xe client gửi để tính giá. `DrivingRouteProvider` là interface nội bộ đã nhận vehicleType.

## Routing và một tuyến dùng chung

- Backend chỉ dùng Goong. Ô tô dùng Direction V2 với `vehicle=car`. Xe máy dùng Direction V1 với `vehicle=bike`. Lỗi Goong trả `ROUTE_UNAVAILABLE`; các chuyến đã lưu giữ nguyên tuyến lịch sử.
- Giữ nguyên tọa độ gửi routing. API xem trước không làm tròn tọa độ; cache key hiện dùng tọa độ nguyên vẹn.
- Flyway V12 thêm `ride_route_quotes` và các cột tuyến trên `rides`; V13 thêm `pickup_note`. Chạy backend để Flyway áp dụng; không sửa migration cũ.
- Báo giá đầu tiên lấy tuyến và lưu snapshot 20 phút, khóa theo fingerprint khách/xe/loại xe/tọa độ trong transaction để tránh gọi trùng đồng thời. Các lần đổi ưu đãi/refresh/create tái dùng snapshot. `routeQuoteId` từ **estimate** giúp tạo chuyến từ chối snapshot hết hạn/không khớp thay vì đổi tuyến âm thầm. Không gửi id `ride:...` của tuyến chuyến đã tạo làm quote id.
- Tạo chuyến sao chép polyline (precision 6), khoảng cách, thời gian, provider vào ride. Bản đồ xác nhận, tracking, driver và báo giá đọc snapshot; không gọi directions riêng ở màn hình. Chuyến lịch sử không có snapshot giữ null, không gọi nhà cung cấp để tự bù tuyến.
- ETA hiện là thời gian tuyến đã lưu, không phải ETA giao thông cập nhật liên tục hay ETA tài xế tới điểm đón. Khoảng cách/ETA từ tài xế tới điểm đón trong offer vẫn là ước lượng theo vị trí gần nhất.

## GPS và development build

- Driver kết nối `/ws-location` với Firebase bearer + X-Role; gửi `/app/location`. Khách subscribe hàng đợi riêng của ride, vẽ vị trí gần nhất và bỏ frame cũ/sai định dạng. Notification `/user/queue/trip` cập nhật trạng thái thay cho polling trên màn hình tracking; reconnect sẽ tải lại chi tiết một lần.
- Driver mặc định throttle 4 giây, chỉ gửi khi di chuyển khoảng 10 m; khi đứng yên có heartbeat 12 giây. Offline chỉ giữ mẫu mới nhất tối đa 10 giây. Dừng GPS khi logout/hết chuyến; khi sẵn sàng nhận chuyến, GPS foreground phục vụ ghép tài xế gần khách.
- `apps/customer/.env`: `EXPO_PUBLIC_LOCATION_STALE_MS=30000` là ngưỡng báo mất tín hiệu.
- `apps/driver/.env`: `EXPO_PUBLIC_DRIVER_LOCATION_INTERVAL_MS=4000` là khoảng tối thiểu giữa mẫu gửi. Không đặt lớn hơn ngưỡng mất tín hiệu. Các biến này không chứa key dịch vụ.
- Driver thêm `expo-task-manager` và config plugin expo-location cho Android foreground service/background location và iOS background location. Phải tạo/cài development build mới; reload JS trên APK cũ không đủ. Driver cần cấp quyền vị trí khi dùng app và vị trí nền. Nếu từ chối nền, app dùng foreground và thông báo giới hạn. OS force-stop/quyền nền bị thu hồi vẫn có thể ngừng gửi; khách hiển thị mất tín hiệu.

## Điểm đón và chỉ đường trong app

Khách nhập pickupNote riêng, chỉnh vị trí bằng cách kéo ghim hoặc dịch bản đồ. Driver nhận note ở offer, chuyến đang chạy và biên bản. Màn hình driver dùng API thật để nhận/bỏ qua yêu cầu, chuyển trạng thái và gửi biên bản (4 góc bắt buộc, đồng hồ tùy chọn); khách vẫn phải xác nhận biên bản theo backend.

Nút “Mở chỉ đường” tải vị trí thiết bị và gọi `/api/location/directions` cho đúng điểm đón hoặc trả và loại xe. Driver hiển thị tuyến, khoảng cách, thời gian dự kiến và các bước Goong trả về trong thanh kéo. Nút cập nhật lấy lại vị trí để tính tuyến mới. Đây là chỉ đường theo từng bước trên màn hình, chưa có giọng nói hoặc tự tính lại liên tục khi xe di chuyển.

Hai app đọc `EXPO_PUBLIC_GOONG_MAP_KEY` để tải bản đồ. Backend đọc `GOONG_API_KEY` để gọi REST. Các file `.env` phải nằm ngoài Git. Sau khi thay SDK bản đồ, build lại development client từ cấu hình Expo.

## Kiểm tra

`npm run check`; test backend `*PricingRideQuoteTests`, `*VehicleRoutingTests`, `*RideRouteSnapshotTests`, `*DriverLocationPolicyTests`, `*RidePickupNoteTests`, `*PlaceSearchTests`. Migration V12/V13 được kiểm tra trong schema thử nghiệm và rollback. Cần kiểm thử GPS foreground/background trên hai điện thoại thật; unit test và APK build không thay thế thử nghiệm này.

Tài liệu: [Goong Direction](https://help.goong.io/kb/rest-api-v2/directions-rest-api-v2/directions-v2/), [Expo Location 58](https://docs.expo.dev/versions/v58.0.0/sdk/location/), [Goong và MapLibre trên React Native](https://help.goong.io/kb/app/react-native/tich-hop-maplibre-tren-nen-ban-do-goong-trong-react-native/).
