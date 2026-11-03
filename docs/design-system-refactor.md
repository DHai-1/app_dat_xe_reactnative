# Refactor UI customer/driver

Project: D:\datxe_rn. Shared UI thực tế là packages/ui (@datxe/ui); giữ tên package hiện có thay vì tạo shared-ui trùng lặp.

## Thay đổi

- ThemeProvider có brand customer/driver và mode light/dark/system. Customer dùng xanh dương; driver dùng xanh lá. Primary, màu chữ trên nút, nền, card, trạng thái, viền và overlay được định nghĩa tập trung.
- Bỏ cơ chế suy đoán dark mode từ mã màu cũ. StyleSheet nhận ThemeColors trực tiếp qua useThemedStyles(factory), được memo theo palette.
- Toàn bộ source UI customer/driver không còn mã HEX/RGB hoặc import palette colors tĩnh. Test quét AST ngăn tái phạm.
- Thêm Typography (giữ kế thừa khi text lồng nhau), ThemedTextInput (placeholder/selection/text theo theme, hỗ trợ ref), ScreenWrapper. Screen dùng các primitive này thay cho native Text/TextInput/SafeAreaView; nút chuẩn dùng Button, vùng tương tác tùy biến dùng MotionPressable.
- Chuẩn hóa Button, Input, Card, các component xác thực/OTP, Header, EmptyState và tab bar. Driver có ThemeProvider ở root, StatusBar theo theme và tab bar có icon/trạng thái đang chọn.
- Chuyển các style inline tĩnh sang StyleSheet.create. Mapbox layer sử dụng thuộc tính riêng của SDK và màu runtime từ context; không đưa lineColor/circleColor vào RN StyleSheet vì khác schema.
- Mapbox native/static web và bản đồ chọn điểm web dùng style sáng/tối; cập nhật route layer sau khi đổi map style.
- Sửa MotionPressable: resolve callback style trước khi truyền vào Animated để không mất nền/layout nút trên web; giữ transform có sẵn, trạng thái pressed/hovered và reduced motion.
- Giới hạn độ rộng form đăng nhập/đăng ký driver bằng cùng token với customer.

## Phạm vi màn hình

30 file *Screen.tsx customer và 15 file *Screen.tsx driver, cùng các component/styles mà các màn dùng. Route vẫn là re-export; không chuyển logic nghiệp vụ vào route.

Customer: auth, booking/chọn điểm/chọn xe/báo giá, tracking/chi tiết/hoàn thành chuyến, xe và biên bản, ưu đãi, chat, lịch sử, thông báo, hồ sơ/chỉnh sửa/thanh toán, cài đặt, hỗ trợ và pháp lý.

Driver: đăng nhập/đăng ký/OTP, GPLX/CCCD/xét duyệt, trang chủ/nhận chuyến, chuyến đang chạy/hoàn thành/bàn giao, lịch sử, thông báo và hồ sơ.

## File nền tảng

- packages/ui/src/theme/ThemeProvider.tsx
- packages/ui/src/theme/colors.ts
- packages/ui/src/components/{Typography,ThemedTextInput,ScreenWrapper,Button,Input,Card,MotionPressable}.tsx
- apps/driver/src/components/{RootLayout,DriverPage,rideStyles}.tsx (rideStyles là .ts)
- apps/customer/src/components/{CustomerTabBar,ScreenHeader,EmptyStateCard}.tsx
- apps/customer/src/components/map/*
- tests/theme.test.cjs, tests/motion-pressable.test.cjs

## Cách kiểm tra

1. npm run check tại root: architecture, typecheck tất cả workspace, lint customer/driver, unit tests.
2. Customer: Cài đặt > Giao diện > Sáng/Tối/Theo hệ thống; mở lại app để kiểm tra lưu lựa chọn. Driver hiện theo theme hệ thống, chưa thêm màn chọn theme riêng.
3. Kiểm tra auth, các tab, nhập liệu/bàn phím, modal, màn lỗi/loading, chọn điểm trên map, form giấy tờ; thử chữ lớn và màn hình nhỏ trên Android/iOS.
4. Kiểm tra màu primary customer/driver khác nhau, chữ trên nút rõ ở cả hai mode; thay theme không đặt lại form hay gọi lại nghiệp vụ.

## Bằng chứng và giới hạn

- Unit tests kiểm tra độ tương phản >=4.5:1 cho các cặp chữ/nền và action chính của bốn palette; quét raw colors/static palette imports/native UI primitives; test hồi quy style của MotionPressable.
- Đã export web customer và driver. Đã quan sát màn login hai app ở dark mode trên trình duyệt, phát hiện và sửa lỗi style AnimatedPressable.
- Chưa kiểm tra trực quan từng màn sau đăng nhập bằng tài khoản thật trên Android/iOS. Không coi kết quả typecheck/unit test là bằng chứng E2E các luồng backend.
- Không thay hợp đồng backend, không thêm dữ liệu mock, không sửa key/.env, không commit.
