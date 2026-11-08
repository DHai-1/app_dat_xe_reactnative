# DatXe — Customer & Driver

Npm workspaces, Expo SDK 58, React Native 0.88, Expo Router. Mã được chuyển từ `D:\app_dat_xe_reactnative`; project nguồn được giữ nguyên.

## Chạy ứng dụng

```powershell
cd D:\datxe_rn
npm ci
npm run customer
# Terminal khác:
npm run driver
```

Customer chạy cổng **8081**, driver chạy cổng **8082**. Hai app dùng Firebase native, Google/Facebook sign-in và cả hai dùng SDK bản đồ Goong, vì vậy cần **development build** đã cài trên thiết bị, không dùng Expo Go.

Trước khi build Android, chép key team vào `apps/customer/team-dev-customer.jks` và `apps/driver/team-dev-driver.jks`. Lệnh `npm run android -w <app>` tự áp dụng cấu hình ký debug. Xem [hướng dẫn team dev và SHA Firebase](docs/team-dev-signing.md).

```powershell
npm run android -w customer
npm run android -w driver
# Trên macOS:
npm run ios -w customer
npm run ios -w driver
# Xem giao diện web:
npm run web -w customer
npm run web -w driver
```

Web giữ giới hạn của nguồn: OTP, Google và Facebook yêu cầu app native. Không dùng mock để vượt đăng nhập thật.

## Cấu hình máy mới

- Sao chép `apps/<app>/.env.example` thành `.env` và điền API URL, OAuth client, Facebook và Goong Map Key tương ứng. Android emulator dùng `10.0.2.2`; điện thoại thật cần IP LAN/URL truy cập được.
- Đặt `google-services.json` trong từng app cho Android; iOS cần `GoogleService-Info.plist` tương ứng bundle ID. Các file này và `.env` được ignore ở cả root lẫn app.
- Cấu hình local hiện có được giữ trong project mới. `EXPO_PUBLIC_*` được đóng gói trong client, không dùng để lưu server secret.
- Hai app đọc `EXPO_PUBLIC_GOONG_MAP_KEY` từ `.env` để tải nền và tile Goong bằng MapLibre. Khóa REST `GOONG_API_KEY` chỉ đặt ở backend. Sau khi đổi env, khởi động lại Metro với `--clear`. Production yêu cầu API URL.
- Sentry chỉ bật khi có `EXPO_PUBLIC_SENTRY_DSN`. Lỗi route được ghi qua `lib/logger.ts`; chưa cấu hình upload source map hoặc gửi release lên Sentry.
- Thông báo đẩy: mỗi app đăng ký/làm mới FCM token theo `installationId` và gỡ token khi đăng xuất. Entry đăng ký background handler trước Router; Expo Notifications hiển thị local banner/dự phòng data-only, xử lý tap/cold start và chờ khôi phục account/router. Backend mới gửi notification+data cho Android/APNs, kèm TTL offer và recipient; app xác thực offer hiện tại trước khi mở. Cần rebuild development client sau khi thêm module và cập nhật backend. Xem [cấu hình, bằng chứng kiểm tra và ma trận QA push](docs/push-notifications.md).

## Cấu trúc

```text
apps/customer/src/
  app/          # chỉ re-export route/layout
  features/     # auth, booking, tracking, vehicles, vouchers, chat,
                # support, profile, history, notifications
  components/   # header, tab bar, empty state, map native/web
  config/       # env
  lib/          # query client, session store, auth wiring, upload
apps/driver/src/
  app/          # giữ các URL cũ; thêm alias ride/handover
  features/     # auth, offers, ride, history, notifications, profile
  components/
  config/
  lib/
packages/
  shared/src/   # HTTP client, Firebase auth, backend DTO, STOMP,
                # format utils, constants; không chứa UI
  ui/src/       # Button/Input/Card, theme, auth UI, UI types và mock cũ
  config/       # TypeScript và ESLint dùng chung
```

Trong mỗi feature: `api.ts` gọi HTTP, `hooks/` xử lý dữ liệu/state, `screens/` dựng giao diện, `components/` chứa các phần giao diện/helper/style của feature. Alias `@/` trỏ vào `src`, `@/assets/` trỏ vào assets của từng app. Các feature không import chéo nhau. ESLint `import/no-restricted-paths` và script kiến trúc kiểm tra chiều import.

Customer dùng Query cho account, chuyến đang hoạt động, tìm tài xế, ước tính giá, lịch sử phân trang, thông báo, phương tiện, voucher, biên bản và tracking. Chat giữ thuật toán gộp tin theo ID của nguồn, Query quản lý lịch poll để tránh thay đổi giao thức phân trang. State nhập liệu/quyền vị trí nằm trong hook; Zustand giữ user và chuyến đang theo dõi trong bộ nhớ. Đăng xuất xóa cache và store.

Customer chuyển nhóm `(main)` thành `(tabs)` cho Home/History/Notifications/Profile. Luồng đặt chuyến: `ride/route-selection` khởi tạo bản nháp → `ride/pickup` → `ride/destination` → `ride/vehicle` → `ride/confirm` → `ride/find-driver`. `ride/map-picker` chọn ghim cho điểm đón/đến; từ xác nhận có thể quay lại sửa từng mục. Các màn hình theo dõi/hoàn tất nằm ở `ride/tracking`, `ride/completed`, `ride/[id]`.

### Đặt chuyến customer

- Tìm địa điểm sau khi nhập ít nhất 2 ký tự, debounce 350ms và hủy request cũ. `/location/places/search` trả gợi ý; Goong dùng `/location/places/detail?id=...` khi chọn để lấy đúng tọa độ, `/location/places/reverse` lấy địa chỉ tại ghim. Ưu tiên điểm đón/GPS được cấp quyền; khi chưa có tọa độ dùng Hà Nội. Không cắt địa chỉ dài chứa số nhà/ngõ/ngách.
- Goong xử lý gợi ý, chi tiết, geocode và tìm tuyến. Backend giữ các endpoint `/location/...` và đổi thứ tự tọa độ từ `lng,lat` của API chỉ đường hiện có sang `lat,lng` khi gọi Goong.
- Customer và Driver dùng chung renderer Goong cho bản đồ native/web. Nút chỉ đường Driver mở bản đồ trong app và tải tuyến theo GPS hiện tại, điểm đón/trả và loại xe.
- Xác nhận hiển thị các thành phần giá backend, giá tối thiểu, giảm giá và tổng thanh toán. Chọn ưu đãi qua modal và xác thực bằng báo giá backend trước khi áp dụng. Có modal giờ hẹn, ghi chú và thanh toán tiền mặt.
- Trước khi tạo chuyến, kiểm tra lại chuyến đang chạy và báo giá. Giá thay đổi yêu cầu xác nhận lại; retry cùng nội dung dùng lại idempotency key. Không cho đặt khi thiếu địa chỉ/xe/giá hoặc còn chuyến chưa hoàn tất.
- Backend riêng tại `D:\datxebackend` có migration `V11__seed_active_vehicle_pricing.sql` (V3 đã tồn tại): CAR mở đầu 20.000đ, 10.000đ/km, tối thiểu 30.000đ; MOTORCYCLE mở đầu 10.000đ, 5.000đ/km, tối thiểu 15.000đ. `INSERT ... WHERE NOT EXISTS` theo loại xe và `active = true` giữ nguyên bảng giá active hiện có. Không có mức giá dự phòng trong app/service; lỗi `PRICING_RULE_NOT_FOUND` hiển thị thông báo thân thiện và cho thử lại/chọn xe khác.

## Phần được giữ nguyên từ nguồn

Driver nhận/bỏ qua offer, tiến độ chuyến, biên bản bàn giao và GPS đã được nối backend. Các phần history, notifications, profile và earnings còn dữ liệu mẫu/state local từ nguồn cần hoàn thiện riêng.

DTO/`RideStatus`/`Role` và hợp đồng map được đối chiếu với backend riêng tại `D:\datxebackend`. STOMP dùng Firebase token, heartbeat, reconnect và khôi phục subscription; đã nối tọa độ tài xế và thông báo chuyến, thay polling ở màn hình customer tracking. Chi tiết migration V12/V13, trường API mới, GPS nền và giới hạn routing xe máy nằm trong [docs/map-upgrade.md](docs/map-upgrade.md).

## Chat tài xế

Tracking Customer có card nhận diện tài xế (avatar, tên, rating và số năm kinh nghiệm). Nhấn card mở modal hồ sơ với hạng GPLX/thông tin xác minh và nút gọi/nhắn tin; gọi chuyển số thật sang ứng dụng điện thoại, nhắn tin mở chat text/ảnh của chuyến. Dữ liệu lấy từ `driver` trong chi tiết chuyến; backend đã bổ sung `yearsOfExperience`, `licenseClass`, `licenseVerified`, `profileVerified`, không trả số/ảnh giấy tờ hoặc ngân hàng. Cần cập nhật backend để có các trường mới. Khi thiếu dữ liệu, UI thông báo chưa cập nhật thay vì tạo giá trị mẫu; chưa có ETA tới điểm đón trong API.

Driver mở chat từ thẻ chuyến đã nhận trên Home, màn chuyến đang thực hiện hoặc nút chat ở header các tab. Badge hiển thị số tin khách chưa đọc. Chat chỉ cho gửi từ `DRIVER_ASSIGNED` đến `VEHICLE_RETURNED`; offer chưa nhận chưa được truy cập cuộc trò chuyện. Chuyến đã đóng vẫn xem được tin cũ khi mở route `/chat?rideId=...`.

Màn hỗ trợ text/ảnh, xem ảnh lớn, tải tin cũ và trạng thái đang gửi/thất bại/đã gửi/đã đọc. Tin lỗi có nút thử lại với cùng `clientMessageId`; ảnh đã upload được tái sử dụng. STOMP cập nhật khi có sự kiện, polling 5 giây dự phòng khi màn chat được focus và app đang active. Chỉ đánh dấu tin khách đã đọc khi màn chat đang mở. Draft và tin chờ gửi hiện giữ trong bộ nhớ của màn, chưa tồn tại sau khi đóng màn hoặc kill app.

Test hồi quy: `node --test tests/driver-chat.test.cjs`. Kiểm tra thiết bị: đăng nhập Customer/Driver thật, nhận chuyến, gửi text/ảnh hai chiều, xác nhận badge giảm sau mở chat, ngắt mạng rồi retry, hoàn tất/hủy chuyến và kiểm tra chat chuyển sang chỉ xem.

## Kiểm tra

```powershell
npm run check
# Hoặc từng bước:
npm run check:architecture
npm run typecheck
npm run lint
npm test
```

Kiểm thử HTTP bao gồm bearer token/role/idempotency, refresh token và retry đúng một lần, xử lý phiên hết hạn, null response, response sai cấu trúc, mất mạng và thiếu user.

```powershell
cd apps/customer
npx expo install --check
npx expo export --platform web --output-dir ../../.expo-export/customer
npx expo export --platform android --output-dir ../../.expo-export/customer-android
# Tương tự trong apps/driver, đổi tên thư mục output.
```

Export Android kiểm tra bundling/Hermes, không thay thế build APK hoặc kiểm thử OTP/booking/backend trên thiết bị. Trên môi trường Windows sandbox, Hermes có thể cần chạy ngoài sandbox để ghi bytecode vào thư mục tạm. Metro có lớp tương thích cho tham chiếu router-store cũ của Sentry trên SDK 58; chỉ module nội bộ tùy chọn đã bị gỡ được trả về rỗng, các dependency khác vẫn phân giải bình thường.

Khi chuyển từ bản development build dùng SDK bản đồ cũ, tạo lại native project từ cấu hình Expo với `npx expo prebuild --clean` rồi build/cài lại từng app. Plugin `packages/config/plugins/with-short-cmake-paths.js` đặt `CMAKE_OBJECT_PATH_MAX=240` và đưa staging C++ xuống `.native-build/<app>` để tránh đường dẫn object quá dài. Cấu hình tự áp dụng lại khi prebuild; không cần sửa file Gradle sinh tự động hay đổi thiết lập Windows toàn cục.

## Git và bản sao dự phòng

Root Git lưu toàn bộ source của hai app; hai Git repository lồng trước đây được chuyển vào `.migration-backup/nested-git/`, giữ lịch sử để phục hồi. Scaffold/file cũ và script di chuyển một lần nằm trong `.migration-backup/`, được ignore. `package-lock.json` là lockfile của project mới; dùng npm từ root.
