# Customer Settings — datxe_rn

## File tạo
- apps/customer/src/app/settings/index.tsx và [section].tsx: route mỏng /settings và /settings/:section.
- apps/customer/src/features/settings/screens/SettingsScreen.tsx: năm mục và các màn con giao diện, thông báo, quyền, địa điểm, ứng dụng.
- apps/customer/src/features/settings/api.ts: gọi autocomplete/detail hiện có.
- apps/customer/src/lib/settings/{SettingsProvider.tsx,i18n.ts}: lưu theo UID, hydrate trước render, dùng chung giữa feature.
- packages/ui/src/theme/ThemeProvider.tsx: ThemeProvider/useTheme/useThemeColors, sẵn dùng cho driver.

## File sửa
RootLayout; ScreenHeader/CustomerTabBar/EmptyStateCard; profile screen/hook/style; booking PlaceSelection screen/hook; maps native và HomeMap web; shared Card và motion; packages/ui index; customer package.json và package-lock.json.

## Đã nối
Giữ Hồ sơ hiện tại, thêm nhóm CÀI ĐẶT cuối trang. Icon trên avatar là photo-camera đổi ảnh, không phải debug gear. Sửa hồ sơ mở màn /edit-profile. Phương thức thanh toán có màn /payment-methods riêng, hiện chỉ CASH; form cá nhân không chứa phương thức thanh toán. Xóa tài khoản hai bước gọi DELETE /api/auth/account, clear bucket và logout (auth hiện có clear query/session). Chưa thử xóa tài khoản thật.
Autocomplete dùng /location/places/search và detail, debounce 600ms + hủy request cũ. Chọn kết quả rồi lưu Nhà/Cơ quan/yêu thích; giữ nguyên tọa độ; gợi ý chọn đón/đến không gọi autocomplete/detail lại.
Quyền location/camera/notifications đọc lại khi quay về từ hệ thống. Phiên bản lấy expo-constants; legal/support dùng route hiện có.

## Chưa làm / giới hạn
- Backend chưa có endpoint preferences/saved places: địa điểm giữ cục bộ theo UID. Đợt rà soát 30/10 đã gỡ công tắc lọc push theo loại vì server chưa xử lý; màn Thông báo chỉ quản lý quyền hệ thống thực. Chưa thay API cũ/migration.
- Đề xuất GET/PUT /api/customer/settings với rideNotifications/chatNotifications/promotionNotifications; CRUD /api/customer/saved-places với kind HOME/WORK/FAVORITE,label,address,lat,lng. Migration mới tiếp theo (phải kiểm tra version trước): customer_preferences(user_id PK/FK, ba boolean default true), customer_saved_places(id,user_id FK,kind,label,address,lat double precision,lng double precision), unique HOME/WORK theo user. Bộ gửi push phải đọc preference server.
- Cỡ chữ là mục tùy chọn, chưa thêm; giữ font scaling hệ thống.
- English đã mở rộng cho toàn bộ giao diện customer, gồm auth/home/booking/tracking/history/notifications/vehicles/vouchers/chat/support/legal, thông báo lỗi có sẵn, dialog, validation và ngày giờ. Nội dung do người dùng/backend nhập tự do (tên, địa chỉ, chat, nội dung thông báo tùy ý) và nhãn địa danh của nhà cung cấp bản đồ giữ nguyên; không tự dịch dữ liệu này. Ngôn ngữ/theme lưu theo thiết bị, địa điểm và tùy chọn thông báo vẫn tách theo UID.
- Dark theme đã mở rộng tới toàn bộ nhóm màn customer và UI dùng chung (auth, booking, tracking, history, notifications, vehicles, vouchers, chat, support, legal); BookingMap web giữ style bản đồ hiện tại. Cần kiểm tra trực quan trên thiết bị thật, đặc biệt ảnh/gradient mang màu thương hiệu.
- Chưa đo/kiểm tra giao diện trực tiếp trên điện thoại. Module AsyncStorage/Notifications mới cần development build mới, reload APK cũ không đủ.

## Cách test
1. npm install; build customer bằng npm run android -w customer (có thay đổi native).
2. Hồ sơ > Cài đặt: vào đủ 5 mục, Back về Hồ sơ, kiểm tra nội dung cũ còn nguyên.
3. Đổi sáng/tối/theo hệ thống và ngôn ngữ, khởi động lại; kiểm tra không render sai theme lúc đọc storage. Đăng nhập user khác không thấy địa điểm user trước.
4. Quyền: từ chối/cấp lại trong hệ thống, quay lại app để kiểm tra status.
5. Lưu Nhà/Cơ quan/yêu thích từ autocomplete, mở chọn đón/đến và chọn gợi ý, xác nhận tọa độ giữ nguyên và không có request search/detail mới.
6. Tài khoản thử: hủy mỗi bước xóa, thử mất mạng; chỉ xóa khi chủ tài khoản đồng ý. Kiểm tra logout/login và clear dữ liệu.

npm run check đã qua: architecture, TypeScript cả workspace, lint cả customer/driver, 39 test (có kiểm tra tương phản theme và tính độc lập giữa thông tin cá nhân/thanh toán). Test hiện có không thay thế test UI/quyền/native mới.

## Màn hồ sơ và thanh toán tách riêng
File mới: features/profile/screens/EditProfileScreen.tsx, PaymentMethodsScreen.tsx; hooks/useProfileEditor.ts; components/AccountScreenStyles.ts; profileForm.ts; routes edit-profile.tsx/payment-methods.tsx. Hồ sơ và Cài đặt đều dẫn vào màn chỉnh sửa mới. Kiểm tra nhập sai email/ngày sinh, hủy khi có thay đổi, lưu thành công rồi quay về; chọn tiền mặt mặc định, xác nhận dữ liệu cá nhân không đổi. Hai màn dùng palette chung sáng/tối và ScreenHeader/Button. Không thay hợp đồng API cũ; chưa thêm cổng VNPay/MoMo.

## Kiểm tra ngôn ngữ toàn app
Chọn Hồ sơ → Cài đặt → Giao diện → English. Kiểm tra tab bar, đăng nhập/OTP, luồng đặt xe, lịch đón, voucher, xe cá nhân, lịch sử, theo dõi, chat, hỗ trợ/điều khoản, hồ sơ và thanh toán. Thử form sai dữ liệu, hộp thoại hủy/xóa (không xác nhận xóa thật), đổi lại Vietnamese. Đóng/mở app và logout vẫn giữ ngôn ngữ đã chọn. Tiền vẫn là VND; không thay đổi dữ liệu gửi API hay tọa độ.

Catalog: packages/shared/src/i18n/en.json; runtime: packages/shared/src/i18n/index.ts; hook reactive: packages/ui/src/useLanguage.ts; native dialogs: packages/ui/src/localizedAlert.ts. Với chuỗi động dùng translate(template, params), không nối nội dung người dùng vào khóa dịch.


## Giao diện Material Design 3
Cài đặt và các màn con sử dụng theme MD3 chung của monorepo trong `packages/ui/src/theme`, đồng bộ với cả app Khách và Tài xế. Light: nền `#F3F4F6`, card `#FFFFFF`; dark: nền `#000000`, card `#1E1E20`. GroupedList, Card, Typography, Button và Input được tái sử dụng từ package UI. Xem `docs/material-design.md` để biết quy ước và cách kiểm tra.

## Thông tin cá nhân và quản lý tài khoản
Card “Thông tin cá nhân” riêng đã gỡ. Nút bút chì ở góc trên bên phải thẻ avatar/tên/số điện thoại/email mở `/edit-profile` bằng hàm `openEdit` hiện có. Thống kê giữ ở phần dưới, tách bằng Divider nhẹ. Tiêu đề nhóm dùng SectionHeading chung với Cài đặt; Hồ sơ hiển thị chữ hoa, màu primary, 14dp/600, letterSpacing 0.8, lề ngang 16dp và cách Card 8dp. Card Cài đặt và hai hành động Đăng xuất / Xóa tài khoản giữ ở cuối Hồ sơ cùng các hộp thoại xác nhận hiện có. Màn con Tài khoản và các hành động trùng lặp trong Settings đã được gỡ; đường dẫn cũ `/settings/account` chuyển về `/settings`.
