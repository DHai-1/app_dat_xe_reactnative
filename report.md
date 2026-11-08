# Báo cáo Đánh giá UI/UX: Ứng dụng Tài xế (Driver App)

**Phạm vi.** 62 ảnh Android trong repo, gồm 61 ảnh dữ liệu minh họa và một ảnh phiên Driver thực tại thời điểm chụp. Không có ảnh Driver mới đính kèm lượt này. Các ảnh chụp ngày 06/11/2026 ghi nhận một bản cũ hơn mã đang có trong workspace. Mỗi ảnh được đánh giá riêng ở mục 3, kể cả ảnh cuộn và biến thể sáng. Đối chiếu mã chỉ xác nhận cấu trúc đã triển khai. Độ tương phản thực tế dưới nắng, khả năng chạm trên giá đỡ và độ trễ trên thiết bị chưa được đo. Bánh răng nổi của Expo trong ảnh được loại khỏi đánh giá chrome của sản phẩm. [Kiểm kê ảnh gốc](apps/driver/screenshot/README.md)

**Mức độ.** **P0** là lỗi khiến tài xế có thể hiểu sai khả năng nhận cuốc, đi sai điểm hoặc xác nhận sai giao dịch. **P1** làm chậm tác vụ chính hoặc khiến thao tác khó tìm. **P2** là vấn đề mật độ, nhất quán hoặc hỗ trợ trong lúc dừng xe. “Đã có trong mã” cần ảnh chụp lại hoặc test trên máy thật trước khi đóng hạng mục.

## 1. Tóm tắt Đánh giá Tổng quan (Executive Summary)

App có nền tối, CTA emerald và hệ thống trạng thái có chữ, đủ để xây tiếp trên MD3. Điểm yếu lớn là thứ tự thông tin. Ảnh cũ dành nhiều diện tích cho cùng một thẻ GPS, danh tính tài xế và thông tin kỹ thuật, trong khi cuốc mới, bước tiếp theo hoặc địa chỉ hiện hành có cùng trọng lượng với nội dung phụ. Kết quả trông giống màn quản trị trên điện thoại. Trên giá đỡ, tài xế phải đọc tuần tự nhiều dòng mới biết có thể làm gì.

1. **P0 · Một màn báo vừa sẵn sàng vừa không sẵn sàng.** Ảnh 20–21 hiển thị badge “Đang nhận chuyến” bên cạnh lỗi GPS và kết nối. Mã Home mới phân biệt “Chế độ nhận chuyến đã bật” và chuyển chẩn đoán xuống dưới, nhưng cần kiểm tra trạng thái tổng hợp khi mạng đang nối lại, vị trí cũ và quyền bị thu hồi. Ở đầu màn chỉ nên có một kết luận vận hành kèm cách xử lý. [Home hiện tại](apps/driver/src/features/offers/screens/HomeScreen.tsx)
2. **P0/P1 · Mất thứ tự giữa quyết định nhận cuốc, chỉ đường và bàn giao.** Ảnh 33/61 có nhãn nhận cuốc lệch và thời gian nhét trong nút. Ảnh 45–46 còn dẫn về điểm đón trong pha trả. Mã đã chuyển offer sang footer, dùng địa chỉ theo pha và gom tuyến ở chuyến đang chạy. Việc còn lại là kiểm tra toàn chuỗi với địa chỉ dài, nhận gần hết hạn, đổi pha và quay lại từ bản đồ ngoài. [Offer](apps/driver/src/features/offers/screens/AcceptScreen.tsx) · [Địa chỉ biên bản](apps/driver/src/features/ride/components/RideStopCard.tsx)
3. **P0 · Màn thanh toán phải trả lời ngay “thu bao nhiêu, đã thu chưa”.** Ảnh 51–55 đặt GPS, cước, trạng thái thanh toán và biên bản thành các khối gần ngang cấp. Mã mới đưa cước lên đầu và ghim nút xác nhận theo trạng thái. Vẫn cần nhãn riêng cho **cước chuyến**, **tiền mặt cần thu** và **thu nhập tài xế**. Chỉ xác nhận theo bản ghi thanh toán, có trạng thái đang ghi nhận và kết quả đã xác nhận. [Chi tiết chuyến](apps/driver/src/features/ride/screens/CompleteScreen.tsx)

### Ngôn ngữ thiết kế và khả năng liếc nhanh

| Khía cạnh | Đánh giá | Chuẩn đề xuất cho Driver |
|---|---|---|
| Màu và Dark Mode | Nền đen tạo phân tách nhưng chuỗi thẻ xám giống nhau che mất thứ tự ưu tiên. Nút emerald dùng cho cả việc tích cực lẫn dừng nhận hoặc đăng xuất trong ảnh cũ, làm mất nghĩa của màu. | Giữ nền tối và tonal surfaces. Ride có token `#121212` / `#1E1E1E` riêng trong mã. Emerald dành cho bước tiến chính và thành công. Amber cho việc cần chú ý, đỏ cho lỗi hoặc hủy. Mỗi trạng thái có chữ và biểu tượng. Kiểm tra Light Mode dưới nắng, tránh chọn theme thay người dùng. [Token màu](packages/ui/src/theme/ThemeProvider.tsx) |
| Chữ và số | Timestamp, nhãn chuyến và chẩn đoán đều nhỏ. Trong ảnh offer, giá đứng dưới địa chỉ dài. Nhiều nhãn viết hoa làm địa chỉ và nhãn cùng thu hút sự chú ý. | Tiêu đề 20–24sp, bước hiện tại hoặc địa danh chính 18–22sp, tiền 28–40sp, ETA 20–24sp, địa chỉ 16–18sp, metadata 13–14sp. Dùng `fontVariant: ["tabular-nums"]` cho tiền, ETA và đếm ngược. Giữ font scaling, cho thông tin thứ cấp xuống hàng ở cỡ chữ lớn. |
| Tương phản | Nhãn xám và trạng thái disable mờ nhìn yếu trong ảnh. Ảnh nén không đủ để kết luận đạt chuẩn. | Kiểm tra cặp token ở cả hai theme và trên ảnh thật. Mục tiêu tối thiểu 4,5:1 cho chữ thường, 3:1 cho chữ lớn theo WCAG. Với ETA, tiền và bước hiện tại, ưu tiên mức cao hơn nếu bảng màu cho phép. [W3C về tương phản](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Mật độ và vùng chạm | Card bao từng trường hoặc từng thao tác làm màn dài. Link chữ thấp và hành động cạnh nhau dễ bấm hụt. | Nhóm theo mục đích, bo thẻ 24dp, padding 16–20dp, cách nhóm 12–16dp. Vùng chạm thực tối thiểu 48×48dp, nút chính 48–52dp khi chữ vừa. Giữ nút cao hơn nếu font lớn cần hai dòng. Dùng footer theo safe area, tránh đè bàn phím hoặc nút hệ thống. [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps) |
| Tương tác khi xe đang di chuyển | Màn chuyến trong ảnh giống form cuộn. Chat, nhập lý do, xem ảnh và giấy tờ đều đòi hỏi sự chú ý kéo dài. | Thiết kế để liếc và nhận biết bước tiếp theo. Chỉ khuyến khích chạm, nhập hoặc xem chi tiết khi đã dừng an toàn. Điều hướng chỉ mở tới điểm của pha hiện tại. Vẫn có cách tiếp cận qua TalkBack với mọi thao tác dùng vuốt. |

### Kiến trúc thông tin theo ngữ cảnh

| Tình huống | Hiện ngay | Đưa xuống hoặc thu gọn |
|---|---|---|
| Chưa có chuyến | Sẵn sàng / đang kết nối / thiếu quyền / bị chặn hồ sơ, dịch vụ hiện chọn, một CTA | Tên đầy đủ nếu lặp, hạng bằng, tuổi mẫu GPS, trạng thái socket, quyền nền và phiên bản app |
| Offer đang đếm ngược | Thu nhập dự kiến, phút/km đến đón, phút/km của chuyến, khu vực đón/trả, thời gian còn lại, Nhận và Bỏ qua | Tên khách trước khi nhận nếu không phục vụ quyết định, ghi chú dài, cước khách trả, kỹ thuật định tuyến |
| Đang chạy | Điểm cần tới, bước hiện tại, ETA có dữ liệu, chỉ đường và hành động tiến bước | Địa chỉ đã qua, cước dự kiến, mã chuyến, nút tải lại và tài liệu cũ |
| Bàn giao khi đã dừng | Pha nhận/trả, ảnh nào thiếu, trạng thái từng ảnh, phản hồi khách, nút gửi hoặc trạng thái chờ | Địa chỉ đầy đủ đã có ở màn chuyến, phiên bản cũ và mã ảnh |
| Sau chuyến | Kết quả, phương thức, số tiền cần thu hoặc đã thu, lối vào tranh soát | Ghi chú đón, trạng thái kỹ thuật, timeline chi tiết và ảnh bàn giao sau mục mở rộng |

## 2. So sánh với Tiêu chuẩn Ngành (Industry Benchmarks: Grab, Uber, Be)

Tài liệu đối thủ thuộc nhiều thị trường và thời điểm. Chỉ đối chiếu các hành vi nguồn mô tả. Hình thức bố cục đề xuất bên dưới là thiết kế cho PtitGo, không khẳng định mọi phiên bản đối thủ dùng cùng một UI.

| Luồng | Đối chiếu có căn cứ | Áp dụng cho Driver |
|---|---|---|
| Đăng ký, giấy tờ và duyệt | Grab Việt Nam mô tả hồ sơ theo loại dịch vụ và thông báo kết quả qua Grab Driver hoặc SMS. Uber hướng dẫn kiểm tra theo từng giấy tờ thiếu, hết hạn hoặc bị từ chối và cập nhật đúng mục. GoPartner Singapore cho tải giấy tờ vào app để xét duyệt và thông báo kích hoạt. [Grab Việt Nam][grab-onboarding] · [Uber Documents][uber-docs] · [GoPartner Onboarding][go-start] | Đưa kết quả duyệt và việc còn thiếu lên đầu. Định tuyến thẳng đến mặt giấy tờ cần sửa. Trạng thái “đã duyệt” khác trạng thái “đủ điều kiện nhận chuyến lúc này”. |
| Bật nhận và bản đồ | Uber Driver UK đặt Go/Go offline trên bản đồ. Grab Malaysia quảng bá bản đồ nhu cầu và dẫn đường trong app từ đón đến trả. be nhắc bật định vị để tránh gián đoạn nhận chuyến. GoPartner Singapore có tùy chọn bật loại dịch vụ đủ điều kiện. [Uber Trip Guide][uber-trip] · [Grab Driver Malaysia][grab-drive] · [beDriver][be] · [GoPartner FAQ][go-faq] | Home hiện là danh sách, chưa có bằng chứng về bản đồ Driver trong luồng chụp. Nếu đưa bản đồ vào Home, đặt trạng thái và CTA trong khay dưới, vẫn hoạt động khi tile bản đồ lỗi. Với Home hiện tại, ưu tiên một trạng thái vận hành và một nút trước khi thêm lớp bản đồ. |
| Xem và nhận cuốc | Uber UK đưa điểm đến và khoản tài xế dự kiến nhận lên trước quyết định. Tài liệu Grab Malaysia mô tả nhận cuốc rồi nhận thông tin hành khách. be phân biệt bỏ qua cuốc với hủy chuyến đã nhận. Grab Việt Nam còn có điểm vào chuyến đặt trước riêng, phạm vi khác offer tức thời. [Uber Trip Guide][uber-trip] · [Grab Booking][grab-job] · [beDriver][be] · [Grab đặt trước][grab-scheduled] | Đưa thu nhập và hai chặng lên trên. Giữ Nhận/Bỏ qua cố định, trạng thái hết hạn riêng. Chuyển chi tiết hành khách và nút mở chỉ đường sang sau khi nhận nếu không cần cho quyết định. |
| Đến đón, đang chạy, trả | Uber minh họa vuốt bắt đầu và hoàn tất, cho xem toàn tuyến bằng chạm bản đồ và dùng chỉ đường ngoài. Grab công bố luồng GPS đến đón rồi thao tác Drop Off khi đến nơi. be mô tả điểm đến và cước thay đổi được cập nhật vào app Driver. [Uber Trip Guide][uber-trip] · [Uber điều hướng ngoài][uber-nav] · [Grab Booking][grab-job] · [beDriver][be] | Giữ CTA đúng pha và tọa độ đúng pha. Nếu thử vuốt để tránh chạm nhầm ở bước quan trọng, giữ phương án chạm có xác nhận và hành vi tương đương cho trợ năng. Khôi phục đúng bước sau khi quay lại từ bản đồ. |
| Bàn giao xe và yêu cầu chỉnh sửa | Các nguồn Uber/Grab về đón và trả khách không mô tả biên bản xe bốn góc có phiên bản. Mô hình gần nhất là xác nhận theo mốc và sửa đúng mục lỗi như cách Uber hướng dẫn với giấy tờ. [Uber Trip Guide][uber-trip] · [Grab Booking][grab-job] · [Uber Documents][uber-docs] | Dùng luồng riêng của PtitGo cho nhận xe, trả xe và yêu cầu chụp lại. Ghép ảnh theo checklist và hiển thị lý do cần sửa bên trên trường liên quan. Giữ lịch sử phiên bản ở mục mở rộng. |
| Thu tiền, lịch sử và thu nhập | Uber hướng tài xế đến chi tiết thu nhập từng chuyến từ tab Earnings. Grab Malaysia mô tả thu cước sau Drop Off. be hướng dẫn xử lý cước sai lệch trong tài liệu địa phương. GoPartner đưa thu nhập vào ví riêng. [Uber Earnings][uber-earnings] · [Grab Booking][grab-job] · [beDriver][be] · [GoPartner FAQ][go-faq] | Dùng số tiền và trạng thái theo bản ghi thật. Tách hồ sơ, lịch sử chuyến và ví. Chính sách thu tiền hoặc sai lệch của ứng dụng khác chỉ là điểm tham chiếu. |
| Chat, hộp thư và trợ giúp | Uber mở gọi hoặc nhắn từ cuốc đã nhận và mô tả một số phản hồi nhanh theo thị trường. Grab Việt Nam cho hành khách chủ động mở lại GrabChat trong khung sau chuyến theo thông báo năm 2024. Grab mô tả lối vào Safety Centre/SOS và kênh xử lý thông thường riêng. be công bố Live Chat và gọi trong app. GoPartner mô tả Help Centre theo loại sự cố. [Uber liên hệ khách][uber-chat] · [GrabChat Việt Nam][grab-chat] · [Grab Safety][grab-safety] · [beDriver][be] · [GoPartner FAQ][go-faq] | Gắn chat và thông báo với mã chuyến, cho mở lại ngữ cảnh chính xác. Giữ chính sách chat hiện có. Tách hỗ trợ phi khẩn cấp với bất kỳ kênh an toàn nào đã được vận hành thật. Không thiết kế nút SOS chỉ để trang trí. |

## 3. Phân tích chi tiết từng màn hình (Screen-by-Screen Analysis)

Mỗi hàng tương ứng một ảnh và bao gồm vấn đề, giải pháp và cách triển khai. Các ảnh cuộn được dùng để kiểm tra sự liên tục của thứ tự nội dung, CTA và trạng thái.

### Màn hình: Khởi động, đăng nhập, đăng ký và OTP

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 01](apps/driver/screenshot/fixtures/01-khoi-dong.png) Khởi động | Chỉ có spinner, không cho biết đang khôi phục phiên hay kẹt mạng. | Thêm “Đang khôi phục phiên”, sau ngưỡng chờ hiện thử lại theo nguyên nhân. | Căn `ActivityIndicator` và text trong `View` có `alignItems: "center"`, dùng `accessibilityLiveRegion="polite"` cho chuyển trạng thái. |
| [Ảnh 02](apps/driver/screenshot/fixtures/02-dang-nhap.png) Đăng nhập | Khoảng trống hero lớn. Ba phương thức có nút gần ngang trọng lượng và dòng Firebase là thuật ngữ kỹ thuật. | Đưa SĐT lên sớm, giữ Google/Facebook nhóm phụ, đổi chú thích thành hướng dẫn OTP và trợ giúp. | Dùng `KeyboardAvoidingView`, input `phone-pad`, nút 48dp và một nhóm phụ MD3. |
| [Ảnh 03](apps/driver/screenshot/fixtures/03-dang-ky.png) Đăng ký đã xác minh | Thẻ xanh xác minh và CTA xanh cạnh nhau, chưa nói còn mấy bước. | Hiện bước “Thông tin cá nhân”, thu gọn trạng thái SĐT thành icon và text. | Dùng `ProgressBar` 3–4dp, `Typography` sentence case, đọc họ tên từ native draft khi gửi. |
| [Ảnh 04](apps/driver/screenshot/fixtures/03b-dang-ky-can-xac-minh.png) Đăng ký cần xác minh | Ảnh gần như giống 03 và vẫn hiển thị SĐT đã xác minh dù tên fixture nói khác. | Chụp lại đúng trạng thái chưa xác minh. Trong UI, hiện việc còn thiếu và hành động xác minh ngay cạnh SĐT. | Render theo cờ xác minh thật từ phiên đăng nhập. Tạo fixture có `phoneNumber` rỗng/chưa xác minh và assert CTA tương ứng. |
| [Ảnh 05](apps/driver/screenshot/fixtures/04-otp.png) OTP có bàn phím | Gợi ý điền mã phủ dòng gửi lại. Nút xác nhận vắng ở vùng nhìn thấy. | Giữ ô OTP bo nhỏ. Chừa khoảng cho gợi ý và bảo đảm có thể đưa CTA vào vùng nhìn thấy khi bàn phím mở. | Một input số và 6 ô minh họa, `autoComplete="sms-otp"` trên Android, kiểm tra KAV và insets với Gboard/Laban Key. |
| [Ảnh 06](apps/driver/screenshot/fixtures/04b-otp-khong-ban-phim.png) OTP ẩn bàn phím | Nút disabled cách xa ô nhập. “Đổi số điện thoại” nhỏ và ở đáy. | Đặt “Đổi số” cạnh số đã che bớt, ghi rõ “Nhập đủ 6 số để xác nhận”. | Giữ hit target 48dp, dùng `tabular-nums` cho đồng hồ và chỉ thông báo trợ năng khi đã có thể gửi lại. |

### Màn hình: Giấy phép lái xe, kỹ năng và căn cước

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 07](apps/driver/screenshot/fixtures/05-gplx-ky-nang-cuon-1.png) GPLX, phần cuộn 1 | Ngày ở định dạng máy. Dấu tròn của loại xe/hộp số nhỏ và nhóm cùng một màu. | Dùng ngày theo locale, tách nhóm lựa chọn có nhãn, hướng ảnh theo từng mặt. | `RadioButton.Group` riêng cho mỗi tập lựa chọn; `List.Item` chạm cả hàng; date picker theo nền tảng. |
| [Ảnh 08](apps/driver/screenshot/fixtures/05-gplx-ky-nang-cuon-2.png) GPLX, phần cuộn 2 | Hai ảnh đã duyệt vẫn có nhãn “Thêm ảnh”, dễ hiểu nhầm là thiếu. | Phân biệt “Xem ảnh”, “Thay ảnh” và “Chụp ảnh”. Chỉ giải thích việc thay ảnh dẫn tới duyệt lại nếu nghiệp vụ áp dụng. | `DocumentRow` nhận trạng thái `missing/uploading/approved/rejected`, render nút phù hợp và progress ngay tại dòng. |
| [Ảnh 09](apps/driver/screenshot/fixtures/05-gplx-ky-nang.png) GPLX, đầu màn | Thẻ GPS đẩy thông tin giấy phép xuống. Mỗi giá trị có thẻ lớn nhưng nhìn giống text tĩnh. | Bỏ GPS khỏi form, nhóm số GPLX, hạng, kinh nghiệm và hạn bằng vào một thẻ. | `PaperTextInput` với nhãn nổi và nền input riêng, lỗi ở cạnh trường, giữ draft và chỉ báo bước. |
| [Ảnh 10](apps/driver/screenshot/fixtures/06-can-cuoc-chan-dung-cuon-1.png) Căn cước, phần cuộn | Ba thẻ ảnh gần giống nhau. Số căn cước đầy đủ chiếm chỗ khi chỉ đối chiếu. | Gom thành checklist 3 hàng, cho xem ảnh, che bớt số ở chế độ đọc. | `GroupedList`, thumbnail 48dp, tải độc lập theo mặt, `accessibilityLabel` nêu rõ mặt trước/sau. |
| [Ảnh 11](apps/driver/screenshot/fixtures/06-can-cuoc-chan-dung.png) Căn cước, đầu màn | GPS và số căn cước đứng trước mục đích xác minh. Chưa thấy hướng dẫn ảnh đủ nét. | Đưa “Xác minh danh tính · 3 ảnh” lên đầu cùng yêu cầu chụp dễ hiểu. | `ProgressBar` theo số ảnh đã tải thành công; trạng thái lỗi/retry theo từng ảnh, giữ nháp nếu quay lại. |

### Màn hình: Xét duyệt hồ sơ

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 12](apps/driver/screenshot/fixtures/07-xet-duyet-dat-cuon-1.png) Đã duyệt, phần cuộn | Mã giấy tờ và nhiều badge xanh làm danh sách dài. Nút về Home nằm cuối. | Tóm tắt hoàn tất, thu gọn giấy tờ đã duyệt, một CTA về Home dễ thấy. | `List.Accordion` cho giấy tờ, không show mã nội bộ mặc định, dùng footer safe area nếu cần. |
| [Ảnh 13](apps/driver/screenshot/fixtures/07-xet-duyet-dat.png) Đã duyệt, đầu màn | Thẻ nhận chuyến đứng trên kết quả xét duyệt. | Đưa “Hồ sơ đã được duyệt” lên vị trí đầu và cho biết bước kế tiếp. | Một `StatusBadge` ở summary, thêm dòng ngắn nếu điều kiện nhận chuyến vẫn chưa sẵn sàng. |
| [Ảnh 14](apps/driver/screenshot/fixtures/07b-xet-duyet-cho.png) Chờ xét duyệt | Badge chờ lặp ở mọi giấy tờ. Màn báo nhận chuyến sẵn sàng dù đang chờ duyệt trong fixture. | Một trạng thái chờ, thêm số mục đang xét và thời điểm cập nhật nếu API có. | Đọc trạng thái duyệt và readiness tách biệt, render lần tải gần nhất từ server/query. |
| [Ảnh 15](apps/driver/screenshot/fixtures/07c-xet-duyet-tu-choi-cuon-1.png) Từ chối, phần cuộn | Lý do nằm ở mặt sau GPLX nhưng hành động sửa là link cập nhật toàn bộ GPLX. | Đặt “Chụp lại mặt sau” ngay sau lý do, giữ các ảnh đã đạt. | Điều hướng kèm tham số loại tài liệu hoặc scroll/focus đúng dòng, giữ query key theo tài khoản. |
| [Ảnh 16](apps/driver/screenshot/fixtures/07c-xet-duyet-tu-choi.png) Từ chối, đầu màn | Lỗi bị chìm giữa GPS và các giấy tờ hợp lệ. | Đưa 1 mục cần xử lý lên đầu, chỉ ra ảnh mờ và cho mở hướng dẫn. | Tách danh sách cần sửa lên trước, dùng màu error container nhẹ và icon kèm nhãn. |

### Màn hình: Trang chủ và trạng thái nhận chuyến

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 17](apps/driver/screenshot/fixtures/08-home-online.png) Đang nhận chuyến | Ba khối cùng nói đang nhận. GPS chiếm phần đầu dù mọi thứ ổn. | Một trạng thái “Sẵn sàng nhận chuyến” và “Tạm ngừng” kiểu tonal. Ưu tiên offer hoặc chuyến hoạt động ở đầu. | `ReceptionSummary` một dòng, chuyển log và timestamps sang Cài đặt nhận chuyến. |
| [Ảnh 18](apps/driver/screenshot/fixtures/08b-home-offline-cuon-1.png) Tạm ngừng, ảnh cuộn | Hai nút xanh gói cả loại xe, số và hạng bằng. Chi tiết kỹ năng lặp bên dưới. | Chọn dịch vụ một lần, sau đó bật bằng một CTA. | Dùng `RadioButton.Group` và nút 48dp. Mã mới đã có cấu trúc này, cần chụp lại cỡ chữ lớn. |
| [Ảnh 19](apps/driver/screenshot/fixtures/08b-home-offline.png) Tạm ngừng | Nút xanh lớn tranh chú ý với trạng thái đang tạm ngừng. | Tiêu đề ngắn “Đang tạm ngừng”, đưa lựa chọn hiện tại sát CTA. | Ràng buộc `selectedVehicleType` vào dịch vụ được duyệt. Khi đổi dịch vụ không tự bật nhận chuyến. |
| [Ảnh 20](apps/driver/screenshot/fixtures/08c-home-gps-loi-cuon-1.png) Lỗi GPS, ảnh cuộn | Badge xanh “Đang nhận chuyến” trái với chẩn đoán mạng và quyền. Hành động tạm ngừng lại là nút nổi nhất. | “Đã bật · Chưa thể nhận” làm trạng thái chính. Hành động nổi bật xử lý nguyên nhân đang chặn. | Dẫn CTA theo `blockedReason`. Chỉ đổi màu xanh khi điều kiện hiệu lực đủ, đừng suy ra từ cờ `online`. |
| [Ảnh 21](apps/driver/screenshot/fixtures/08c-home-gps-loi.png) Lỗi GPS, đầu màn | Cùng lúc có mất kết nối, chưa cấp GPS và “vị trí nền đang bật”. Tài xế phải tự chọn lỗi nào sửa trước. | Tóm tắt “Cần cấp quyền vị trí” hoặc “Đang kết nối lại” theo mức ưu tiên, còn lại ở mục Chi tiết. | Phân biệt quyền foreground/background, mẫu GPS cũ và socket offline. Kiểm tra trường hợp nhiều lỗi xuất hiện đồng thời. |
| [Ảnh 22](apps/driver/screenshot/fixtures/08d-home-ho-so-cho-duyet.png) Hồ sơ chờ duyệt | Chỉ có link hoàn tất hồ sơ, thiếu lý do cụ thể và trạng thái. | Đưa “Chưa thể nhận chuyến” lên đầu cùng việc cần làm hoặc đang chờ ai. | Render theo approval status và giấy tờ thiếu, gắn điểm vào route duyệt hoặc tài liệu tương ứng. |
| [Ảnh 60](apps/driver/screenshot/fixtures/18-home-light.png) Home sáng | Màu sáng dễ tách nền hơn nhưng nội dung vẫn lặp và nhiều chữ nhỏ. | Giữ cùng thứ tự ưu tiên của bản tối, kiểm tra text xám và disable dưới nắng. | Dùng token theo theme, kiểm tra 360dp và font scale 1,3–2,0, không ép một dòng cho trạng thái dài. |
| [Ảnh 62](apps/driver/screenshot/native/00-home-phien-hien-tai.png) Phiên Driver thực | Tên dài chiếm hai dòng, thông tin chính trùng với fixture. Ảnh chứa dữ liệu cá nhân. | Giữ tên trong header/hồ sơ, một kết luận readiness ở Home. Che dữ liệu cá nhân khi chia sẻ audit. | Dùng dữ liệu mô phỏng cho snapshot, giới hạn hai dòng khi tên thật dài và giữ truy cập được tên đầy đủ. |

### Màn hình: Lịch sử chuyến

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 23](apps/driver/screenshot/fixtures/09-lich-su-cuon-1.png) Lịch sử, ảnh cuộn | Hai địa chỉ nối thành một khối văn bản. Chuyến hủy vẫn có số tiền dễ bị hiểu là thu nhập. | Đón/trả thành hai dòng riêng, tối đa hai dòng mỗi địa chỉ. Với chuyến hủy, nêu ý nghĩa số tiền hoặc ẩn nếu không có giao dịch. | `FlatList`, `numberOfLines={2}`, dot và nhãn có nghĩa, card chạm được với `accessibilityRole="button"`. |
| [Ảnh 24](apps/driver/screenshot/fixtures/09-lich-su.png) Lịch sử, đầu màn | GPS đẩy kết quả đầu tiên xuống. Mã chuyến, badge, giờ và giá khó quét theo cột. | Ghim tìm/lọc ở đầu nếu cần, mã và trạng thái cùng hàng, giờ phụ và giá căn phải. | `flexWrap` ở header card, `minWidth: 0` cho địa chỉ, biểu diễn tiền bằng `tabular-nums`. |
| [Ảnh 25](apps/driver/screenshot/fixtures/09b-lich-su-rong.png) Lịch sử rỗng | “Bạn chưa có chuyến đi” nằm dưới khối GPS lớn. | Empty state trong vùng danh sách, phân biệt chưa có chuyến với lọc không khớp. | `ListEmptyComponent`, chỉ hiện “Bỏ bộ lọc” nếu bộ lọc đang áp dụng. |
| [Ảnh 26](apps/driver/screenshot/fixtures/09c-lich-su-loi.png) Lịch sử lỗi | Khối đỏ bão hòa và nút xanh đối chọi. Lỗi dễ bị hiểu là không có chuyến. | Banner lỗi nhẹ, giữ bản ghi đã tải nếu có và cho thử lại ngay tại danh sách. | `isRefetchError` tách với lần tải đầu, `errorContainer`, `accessibilityRole="alert"`. |

### Màn hình: Thông báo

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 27](apps/driver/screenshot/fixtures/10-thong-bao-cuon-1.png) Hộp thư, ảnh cuộn | Nhãn “Đã đọc” lặp lại và cùng trọng lượng với nhãn chưa đọc. | Dùng dot chưa đọc có nhãn trợ năng, nhóm theo ngày, thu gọn mục đã đọc. | `SectionList`, `keyExtractor` theo ID, tiêu đề 16sp và thời gian 13sp. |
| [Ảnh 28](apps/driver/screenshot/fixtures/10-thong-bao.png) Hộp thư, đầu màn | “Đánh dấu tất cả” đứng trên nội dung nhưng thiếu số chưa đọc trong ảnh. Cuốc mới trông như mục hồ sơ. | Nêu số chưa đọc, ưu tiên tin có tác vụ và dẫn đến đúng cuốc/hồ sơ, kể cả mục đã đọc. | Dùng adapter điều hướng thông báo hiện có, xử lý đích hết hạn và cập nhật badge sau mutation. |
| [Ảnh 29](apps/driver/screenshot/fixtures/10b-thong-bao-rong.png) Hộp thư rỗng | GPS lấn át thông điệp rỗng, bố cục dễ bị hiểu là đang chờ tải. | Empty state yên tĩnh và phân biệt tải, lỗi, rỗng. | Chỉ hiện “Đọc tất cả” khi `unread > 0`, giữ trạng thái trống giữa vùng list. |

### Màn hình: Hồ sơ và ví

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 30](apps/driver/screenshot/fixtures/11-ho-so-cuon-1.png) Hồ sơ, phần cuộn 1 | Hỗ trợ, số dư và giao dịch nằm liền nhau, không có ranh giới ngữ cảnh. | Hiện số dư và một mục “Mở ví”, tách giấy tờ và hỗ trợ thành nhóm. | `GroupedList` với header 14sp, `Divider` mờ. Điều hướng đến ví Driver đã có. |
| [Ảnh 31](apps/driver/screenshot/fixtures/11-ho-so-cuon-2.png) Hồ sơ, phần cuộn 2 | “Giao dịch ví” xuất hiện nhiều lần. Đăng xuất xanh như CTA kiếm chuyến. | Trong hồ sơ chỉ giữ lối vào ví và quản lý tài khoản. Đăng xuất dùng tonal trung tính và hộp xác nhận. | Dùng `DriverConfirmationDialog`, giữ thao tác xóa tài khoản tách riêng theo mức độ. |
| [Ảnh 32](apps/driver/screenshot/fixtures/11-ho-so.png) Hồ sơ, đầu màn | SĐT, GPLX và năm kinh nghiệm như bản ghi dữ liệu. Khối GPS đứng đầu. | Avatar và tên làm điểm chính. Chỉnh sửa cạnh tên, GPLX ở mục giấy tờ, che bớt mã. | Hàng avatar + text `flex: 1`, icon chỉnh sửa vùng chạm 48dp, email một dòng khi xem tóm tắt. |

### Màn hình: Yêu cầu chuyến đi

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 33](apps/driver/screenshot/fixtures/12-nhan-cuoc.png) Offer tối | “Nhận chuyến (10s)” lệch lên trái. Giá ở cuối, ghi chú và mở bản đồ ngoài đứng trước quyết định. | Một sheet ngắn với khoản tài xế nhận, ETA/km hai chặng và hai lựa chọn cố định. Tách bộ đếm khỏi nhãn CTA. | Dùng `DriverPage.footer` hiện có, `Button` chung, `tabular-nums`, và thời hạn server. Thử `@gorhom/bottom-sheet` nếu sau này có nền bản đồ Driver, sau khi kiểm tra tương thích Expo. |
| [Ảnh 34](apps/driver/screenshot/fixtures/12b-offer-khong-con.png) Offer không còn | Cảnh báo và thẻ trống lặp cùng ý. “Tải lại” làm tài xế chưa biết có thể nhận lại cuốc này không. | Một trạng thái cụ thể “Đã hết hạn” hoặc “Cuốc không còn khả dụng”. Ưu tiên “Về trang chủ”, thử lại khi lỗi tải có thể phục hồi. | Ánh xạ lỗi, hủy từ khách và hết giờ vào trạng thái riêng, giữ mutation idempotent. |
| [Ảnh 61](apps/driver/screenshot/fixtures/19-offer-light.png) Offer sáng | Lỗi lệch nút giống bản tối. Chữ giá dễ đọc nhưng vẫn ở dưới khối nội dung dài. | Áp dụng cùng bố cục với bản tối, giữ số tiền và hai chặng trong viewport đầu. | Snapshot sáng/tối với địa chỉ dài, tiền nhiều chữ số, trạng thái loading và hết hạn. |

Mã offer đã có thu nhập dự kiến, khoảng cách/ETA tới đón, thời lượng/km của chuyến, footer và bộ đếm dựa trên dữ liệu server. Ảnh 10 giây là fixture cũ. Giá trị cấu hình backend mặc định hiện thấy là 27 giây và có thể bị môi trường ghi đè. Cần đo cửa sổ thực tế trên thiết bị, gồm thời gian nhận push, mở màn và điều kiện server chấp nhận. [Màn offer](apps/driver/src/features/offers/screens/AcceptScreen.tsx) · [Hook offer](apps/driver/src/features/offers/hooks/useAccept.ts)

### Màn hình: Chuyến đang thực hiện

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 35](apps/driver/screenshot/fixtures/13-chuyen-da-nhan-cuon-1.png) Đã nhận, ảnh cuộn | Chỉ đường và “Đi đón khách” là hai nút xanh như nhau. Nhãn chỉ đường lệch. | Nút chỉ đường cạnh điểm đón, “Đi đón khách” là CTA tiến bước duy nhất. | `RideRouteCard` và `IconButton` tròn 48dp, CTA đặt ngoài vùng cuộn. |
| [Ảnh 36](apps/driver/screenshot/fixtures/13-chuyen-da-nhan.png) Đã nhận, đầu màn | Thanh chat có badge rõ nhưng chen trước địa chỉ. Khối đón và trả có cùng độ nổi. | Đặt điểm đón và ghi chú ngắn lên đầu. Chat/gọi là nhóm phụ trong thẻ người đi. | Đặt `currentStop` theo pha, dùng flex cho địa chỉ và vùng icon cố định. |
| [Ảnh 37](apps/driver/screenshot/fixtures/13b-dang-den-don.png) Đang đến đón | “Đã tới điểm đón” dễ chạm nhầm cạnh nút chỉ đường. | Hiện “Đang tới điểm đón”, nhấn mạnh địa chỉ hiện tại và chỉ có một nút báo đã tới. | Nếu nghiệp vụ cần ngăn báo nhầm, dùng xác nhận một bước. Khi GPS thiếu, xử lý trạng thái đó theo chính sách hiện có. |
| [Ảnh 38](apps/driver/screenshot/fixtures/13c-cho-xac-nhan-nhan-xe-cuon-1.png) Chờ xác nhận, ảnh cuộn | Lời nhắc đang chờ nằm dưới hai địa chỉ và chỉ đường. | Đưa “Chờ khách xác nhận” sát bước hiện tại, cho xem biên bản đang chờ. | Render trạng thái chờ theo báo cáo của pha. Giữ hành động bắt đầu theo điều kiện hiện có. |
| [Ảnh 39](apps/driver/screenshot/fixtures/13c-cho-xac-nhan-nhan-xe.png) Chờ xác nhận, đầu màn | Badge “Đang bàn giao xe” chưa cho biết ai cần làm gì. | Thêm câu “Khách đang kiểm tra biên bản nhận xe” và phản hồi mới nếu có. | Bổ sung `accessibilityLiveRegion` cho đổi trạng thái. Giữ biên bản tóm tắt trong dòng hoặc sheet khi xe đã dừng. |
| [Ảnh 40](apps/driver/screenshot/fixtures/13d-dang-chay-cuon-1.png) Đang chạy, ảnh cuộn | Chỉ đường đã nhắm điểm trả nhưng điểm đón và ghi chú cũ vẫn đứng trên. | Làm nổi bật điểm trả và ETA, điểm đón có thể xem trong lộ trình đầy đủ. | Đổi thứ bậc theo pha mà giữ thứ tự địa lý trong timeline. CTA “Đã tới điểm trả” cố định. |
| [Ảnh 41](apps/driver/screenshot/fixtures/13d-dang-chay.png) Đang chạy, đầu màn | Khối chữ chiếm phần lớn màn, không có bản đồ hay ETA nổi bật trong ảnh. | Nếu có dữ liệu dẫn đường đáng tin cậy, dùng bản đồ tuyến hoặc link mở bản đồ cạnh địa chỉ. Khi thiếu ETA, hiển thị trạng thái rõ. | Bản đồ phía dưới lớp overlay, `fitBounds` theo tuyến nếu có. Giữ fallback địa chỉ + nút điều hướng khi bản đồ lỗi. |
| [Ảnh 42](apps/driver/screenshot/fixtures/13e-khong-co-chuyen.png) Không có chuyến | Dòng text ngắn ở đầu màn, phần còn lại trống. Không thấy lối về chính. | Empty state có CTA “Về trang chủ” và không hiển thị hành động của chuyến cũ. | Tách loading/error/empty. Kiểm tra liên kết mở từ push khi chuyến vừa kết thúc. |

### Màn hình: Biên bản nhận xe, trả xe và yêu cầu điều chỉnh

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 43](apps/driver/screenshot/fixtures/14-bien-ban-nhan-xe-cuon-1.png) Nhận xe, ảnh cuộn | Năm nút chụp xếp riêng, trạng thái còn thiếu không nổi bật. CTA xanh nhìn như đã đủ dữ liệu. | Gom bốn góc bắt buộc thành checklist “0/4”, ảnh đồng hồ tách tùy chọn, giải thích vì sao chưa gửi được. | `CaptureRow` có `missing/uploading/uploaded/failed`, đếm ảnh đã upload thành công và vô hiệu gửi đúng điều kiện. |
| [Ảnh 44](apps/driver/screenshot/fixtures/14-bien-ban-nhan-xe.png) Nhận xe, đầu màn | Odometer, nhiên liệu, ghi chú nhìn như text tĩnh. Địa chỉ chiếm nhiều chỗ khi tài xế đã tới. | Thu gọn địa chỉ, làm rõ trường nhập bằng nền tonal hoặc outline mờ, ghi đơn vị cạnh giá trị. | `PaperTextInput` nhãn nổi, `keyboardType="number-pad"` cho km/% và lỗi ngay dưới trường. |
| [Ảnh 45](apps/driver/screenshot/fixtures/14b-bien-ban-tra-xe-cuon-1.png) Trả xe, ảnh cuộn | Cuộn tới form vẫn thấy link chỉ đường tới điểm đón. | Dùng duy nhất tọa độ và nhãn pha trả. Ẩn hướng dẫn đón. | Dùng chung `phase` cho địa chỉ, link, ghi chú và nhãn. Kiểm tra deep link khôi phục pha trả. |
| [Ảnh 46](apps/driver/screenshot/fixtures/14b-bien-ban-tra-xe.png) Trả xe, đầu màn | Tiêu đề trả xe nhưng địa chỉ và chỉ đường cùng là điểm đón. Đây là lỗi P0 trong ảnh. | Hiện “Điểm trả” và đúng địa chỉ trả. Khi thiếu tọa độ, vô hiệu nút kèm lý do rõ. | Test `RideStopCard` nhận/trả với hai cặp tọa độ khác nhau. Mã hiện đã phân pha. |
| [Ảnh 47](apps/driver/screenshot/fixtures/14c-bien-ban-sua-lai-cuon-1.png) Chỉnh sửa, phần cuộn 1 | Có giá trị cũ nhưng tại chỗ không nhắc khách phản hồi mục nào. | Nhắc lý do ở đầu form và cạnh trường bị phản hồi nếu xác định được. | Banner amber kèm `correctionReason` nguyên văn, giữ bản nháp theo chuyến/pha/phiên bản. |
| [Ảnh 48](apps/driver/screenshot/fixtures/14c-bien-ban-sua-lai-cuon-2.png) Chỉnh sửa, phần cuộn 2 | “Xem 1 phiên bản trước” cạnh nút gửi nhưng chưa chỉ ra sẽ gửi phiên bản nào. | Tách “Phiên bản trước” thành mục mở rộng và cho biết bản gửi mới sẽ cần xác nhận lại. | `List.Accordion` cho lịch sử, khóa gửi trong khi upload và giữ optimistic UI trong phạm vi bản nháp. |
| [Ảnh 49](apps/driver/screenshot/fixtures/14c-bien-ban-sua-lai.png) Chỉnh sửa, đầu màn | Phản hồi khách bị đẩy dưới địa chỉ, card xám giống các khối khác. | Banner amber đặt trước địa chỉ, nội dung khách phản hồi nổi hơn đoạn giải thích. | Một alert icon + tiêu đề + nội dung, giữ màu chữ có tương phản và trạng thái `alert`. |
| [Ảnh 50](apps/driver/screenshot/fixtures/14d-bien-ban-cho-xac-nhan.png) Biên bản chờ xác nhận | Km và ghi chú dính thành một dòng, ảnh và nhiên liệu không thấy trong fixture. Chưa có bước tiếp theo rõ. | Dùng badge tiếng Việt, hai ô số liệu, lưới ảnh 2×2 nếu có dữ liệu và nút kiểm tra xác nhận. | `HandoverSummary` dùng ảnh 4:3, radius 12dp, overlay nhãn, mở ảnh lớn. Giá trị nhiên liệu 0% vẫn là dữ liệu hợp lệ. |

Mã hiện đã có banner amber, input outlined, tóm tắt dạng lưới và chỉ đường theo pha. Fixture ảnh 50 không chứng minh trạng thái thiếu ảnh trên bản hiện tại. Cần chụp lại biên bản với bốn ảnh, ảnh lỗi và một bản yêu cầu chụp lại. [Màn biên bản](apps/driver/src/features/ride/screens/VehicleInspectionScreen.tsx) · [Tóm tắt biên bản](apps/driver/src/features/ride/components/HandoverSummary.tsx)

### Màn hình: Chi tiết chuyến và thanh toán

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 51](apps/driver/screenshot/fixtures/15-chi-tiet-tien-mat-cho-cuon-1.png) Tiền mặt, phần cuộn 1 | Nút xác nhận di chuyển theo nội dung. Hai biên bản có cùng diện tích với nghiệp vụ thu tiền. | Ghim CTA đáy, cho biết số tiền mặt cần thu cạnh xác nhận. Biên bản để dưới tóm tắt. | `footer` nằm ngoài `ScrollView`, dialog nêu số tiền và phương thức từ bản ghi hiện hành. |
| [Ảnh 52](apps/driver/screenshot/fixtures/15-chi-tiet-tien-mat-cho-cuon-2.png) Tiền mặt, phần cuộn 2 | Timeline dùng nhiều badge lớn, lặp kết quả đã thấy. | Gom timeline vào mục “Mốc chuyến đi”, chấm nhỏ và thời gian phụ. | Một hàng timeline gồm dot, label, timestamp. Với cùng trạng thái lặp, phân biệt lịch sử thực và bản ghi trùng trước khi gộp. |
| [Ảnh 53](apps/driver/screenshot/fixtures/15-chi-tiet-tien-mat-cho.png) Tiền mặt, đầu màn | GPS đứng trước cước. Hai địa chỉ dính nhau. “Cước chuyến đi” chưa cho biết có trùng tiền mặt phải thu. | Đưa số tiền cần thu và tình trạng thanh toán lên đầu. Lộ trình là nhóm thứ hai. | Tách `ride.finalFare` và `payment.amount`; hiện đúng nhãn, chỉ xác nhận cho `CASH/PENDING`. |
| [Ảnh 54](apps/driver/screenshot/fixtures/15b-chi-tiet-da-thu.png) Đã thu | Hai số tiền giống nhau nằm ở hai khối và trạng thái “Đã thanh toán” tách khỏi thời gian. | Tóm tắt một trạng thái đã thu, số tiền và giờ xác nhận. Chi tiết cước nằm trong mục riêng nếu cần đối soát. | Hiện từ `payment.status` và `paidAt`, cập nhật cache sau mutation, kiểm tra retry không ghi nhận lần nữa. |
| [Ảnh 55](apps/driver/screenshot/fixtures/15c-chi-tiet-da-huy.png) Đã hủy | Giá dự kiến lớn dễ bị hiểu là tiền đã thu. Trạng thái hủy chưa nói rõ ai hủy trong vùng đầu ảnh. | Đưa ai hủy và lý do lên summary nếu có, chỉ hiện số tiền với nhãn đúng nghĩa. | Render theo status và dữ liệu thực. Không hiện CTA thu tiền cho chuyến hủy. |

### Màn hình: Nhắn tin

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 56](apps/driver/screenshot/fixtures/16-chat.png) Chat | Chỉ có vai trò và mã chuyến ở header. Dấu phân ngày, trạng thái mạng và affordance xem ảnh chưa thể hiện trong ảnh. Khoảng trống với hai tin là bình thường, nhưng không nên dùng để đánh giá khả năng cuộn khi hội thoại dài. | Giữ tên/avatar và mã chuyến, phân ngày, nút về tin mới, ảnh có chỉ dấu mở rộng. Chat đầy đủ dành cho lúc xe đã dừng. | Mã mới có `ChatConversation` dùng chung, `FlatList` đảo chiều và modal zoom. Test ảnh dọc/ngang, ảnh lỗi, gửi lại, tải tin cũ, TalkBack và phím Back. |

Ảnh 56 chỉ có tin văn bản. Mã mới đã có xem ảnh toàn màn hình và cử chỉ zoom, nên việc cần làm là kiểm tra trực tiếp trên Android/iOS, gồm đóng modal và quay lại đúng vị trí cuộn. [Chat dùng chung](packages/ui/src/chat/ChatConversation.tsx) · [Trình xem ảnh](packages/ui/src/chat/ChatImageViewer.tsx)

### Màn hình: Trợ giúp và phản hồi

| Ảnh | Vấn đề UX/UI hiện tại | Giải pháp thiết kế lại | Gợi ý Code/Style (React Native) |
|---|---|---|---|
| [Ảnh 57](apps/driver/screenshot/fixtures/17-tro-giup-cuon-1.png) Trợ giúp, phần cuộn 1 | Radio và form nằm nối tiếp nhưng khó nhận ra bước đã chọn và việc còn thiếu. | Nhóm chủ đề trong một danh sách, tiêu đề form gọn và hiện chuyến liên quan ngay cạnh chủ đề. | `RadioButton.Item` chạm cả dòng, input có nhãn, chỉ hiển thị lỗi sau khi cần. |
| [Ảnh 58](apps/driver/screenshot/fixtures/17-tro-giup-cuon-2.png) Trợ giúp, phần cuộn 2 | Bộ đếm nhỏ, thêm ảnh và gửi cùng dạng nút dài. Phản hồi và yêu cầu mới thiếu tách bậc. | Đổi thêm ảnh thành hàng đính kèm có số ảnh, giữ nút gửi rõ, chuyển lịch sử yêu cầu sang một vùng riêng. | `KeyboardAvoidingView`, nháp uncontrolled, vùng bấm 48dp, lưu trạng thái gửi và hiển thị mã tiếp nhận sau thành công. |
| [Ảnh 59](apps/driver/screenshot/fixtures/17-tro-giup.png) Trợ giúp, đầu màn | Cảnh báo phi khẩn cấp ở dưới GPS. Chuyến liên quan và chủ đề đều mang hình thức thẻ ngang cấp. | Đưa cảnh báo lên đầu, chọn chuyến bằng một hàng và ưu tiên chủ đề. Giữ kênh khẩn cấp riêng nếu có kênh thật. | Tránh chèn diagnostics toàn trang. Dùng `GroupedList` và mở chọn chuyến bằng sheet có nút đóng rõ. |

### Đối chiếu mã mới và khoảng trống bằng chứng

- **Đã sửa theo mã.** GPS không còn được chèn toàn cục trong `DriverPage`. Home đã tách phần cài đặt nhận chuyến. Lịch sử và hộp thư đã có các cải tiến về phân cấp. Offer đã có footer, chuyến đang chạy đã gom tuyến và hành động theo pha. Ảnh cũ dùng để nhận diện hồi quy, không dùng để tuyên bố các lỗi đó còn tái hiện. [DriverPage](apps/driver/src/components/DriverPage.tsx) · [Lịch sử](apps/driver/src/features/history/screens/HistoryScreen.tsx) · [Hộp thư](apps/driver/src/features/notifications/screens/NotificationsScreen.tsx)
- **Chưa có ảnh phù hợp.** Cần chụp bổ sung Cài đặt, chẩn đoán nhận chuyến, sửa hồ sơ, ví, thoại xác nhận hủy chuyến/thu tiền, chat có ảnh và zoom, mất mạng giữa chuyến, trả xe đã xác nhận và bước hoàn tất. Tránh suy ra từ ảnh khác rằng một nút hoặc màn chưa được triển khai. [Cài đặt Driver](apps/driver/src/features/settings/screens/DriverSettingsScreen.tsx) · [Sửa hồ sơ](apps/driver/src/features/profile/screens/EditDriverProfileScreen.tsx) · [Ví](apps/driver/src/features/profile/screens/DriverWalletScreen.tsx)

## 4. Kế hoạch Hành động (Action Plan)

### Quick Wins · 1–2 giờ mỗi hạng mục

| Ưu tiên | Hạng mục | Điều kiện nghiệm thu |
|---|---|---|
| P0 | **Một trạng thái trên Home.** Đưa kết luận readiness và nguyên nhân chính lên đầu, thay diễn giải cờ tài khoản bằng ngôn ngữ vận hành. | Chụp bốn trạng thái gồm offline chủ động, đang kết nối, thiếu GPS và thực sự sẵn sàng. Không có hai nhãn mâu thuẫn trong cùng viewport. |
| P0 | **Kiểm tra nhận cuốc và chỉ đường.** Chụp lại nút đã dùng component chung, kiểm tra cả pha trả xe. | CTA căn giữa, nút chỉ đường có nhãn trợ năng đúng pha, thiếu tọa độ không mở nhầm bản đồ, offer hết hạn không nhận được. |
| P0 | **Nhãn thu tiền rõ ràng.** Hiện khoản tiền mặt phải thu ngay cạnh hành động xác nhận, nêu số tiền trong dialog nếu dữ liệu sẵn có. | Tiền mặt chờ, tiền mặt đã thu, thanh toán không tiền mặt và chuyến hủy hiển thị đúng. Mất mạng giữa xác nhận giữ trạng thái có thể đối soát. |
| P1 | **Cỡ chữ và vùng bấm.** Tăng metadata cần thiết lên 13–14sp và nâng các nút icon/lối vào phụ lên vùng chạm 48dp. | Soát 360dp, font scale 1,3 và 2,0. ETA, tiền và CTA nhìn được. Các chữ dài xuống dòng, không đẩy nút ra ngoài safe area. |
| P1 | **Phản hồi form và màn rỗng.** Chụp lại OTP khi bàn phím mở, đặt lỗi theo trường và nói rõ cách tiếp tục ở trạng thái rỗng. | OTP không che nút gửi lại. Lịch sử và hộp thư phân biệt tải, lỗi, rỗng và lọc không có kết quả. |
| P2 | **Bỏ dữ liệu lặp.** Bỏ mã giấy tờ khỏi danh sách đọc, ẩn nhãn “Đã đọc” lặp, gom ví vào một điểm vào, dùng sentence case cho nhãn. | Mỗi khối trả lời một câu hỏi. Tài xế vẫn mở được dữ liệu đầy đủ khi cần. |

### Major Reworks · Theo thứ tự triển khai

1. **Home theo trạng thái vận hành.** Tách tạm ngừng, đang kết nối, sẵn sàng, bị chặn và có chuyến hoạt động. Dẫn trạng thái từ các điều kiện hiện có theo thứ tự ưu tiên. Đưa offer/chuyến đang chạy lên trước. Nếu triển khai bản đồ Driver, phát triển sau khi luồng nhận đã đo được, giữ tải bản đồ độc lập với quyền bật nhận và dữ liệu chuyến.
2. **Offer và chuyến đang chạy.** Xây header quyết định nhận cuốc và footer hành động dùng chung. Cố định thứ tự khoản nhận, chặng đến đón và chặng chính. Với chuyến đang chạy, thêm điểm hiện hành, khả năng quay về từ bản đồ ngoài và test đổi pha. Khi thử chuyển động của sheet hoặc cử chỉ vuốt, tôn trọng Reduce Motion, luôn có nút hoặc hành động trợ năng tương đương. Giữ thời hạn, phí và điều kiện từ server.
3. **Bàn giao và ngoại lệ.** Tách phần nhập, chụp ảnh, xem lại và yêu cầu điều chỉnh thành các thành phần có trạng thái rõ. Giữ nháp khi mở camera hoặc đưa app xuống nền. Tải lại theo từng ảnh và cho thấy tài xế đang gửi phiên bản nào. Cho phép tra cứu bản cũ theo nhu cầu.
4. **Thanh toán, lịch sử và ví.** Chuẩn hóa nhãn hiển thị theo ngữ nghĩa dữ liệu, xử lý thanh toán đang chờ và xác nhận muộn. Một nút tiến bước ở chi tiết, một lối vào ví, một đường hỗ trợ theo chuyến. Đo việc tài xế có đọc đúng số tiền phải thu và phân biệt với thu nhập hay không.
5. **Chat, thông báo và hỗ trợ.** Xác minh ảnh chat và khả năng trở lại đúng chuyến. Chuẩn hóa đích của thông báo đã đọc và đích hết hạn. Thử mẫu tin ngắn cho tình huống đón/trả khi đã dừng, chỉ bổ sung nếu có nhu cầu thực tế. Tách yêu cầu hỗ trợ thường khỏi luồng sự cố an toàn dựa trên quy trình vận hành thật.

### Ma trận kiểm tra trước phát hành

| Kịch bản | Tiêu chí đề xuất |
|---|---|
| Nhìn nhanh trên giá đỡ, khi xe dừng | Trong 2 giây nhận ra trạng thái nhận cuốc, điểm hiện hành hoặc số tiền cần thu. Trong 5 giây ở bài test offer, chỉ đúng khoản nhận và ETA đến đón. Đây là mục tiêu kiểm thử nội bộ, chưa phải kết quả đo. |
| Ngoài trời và ban đêm | Test hai theme trên Android màn nhỏ và một iPhone. Đo cặp màu và kiểm tra thực tế dưới nắng. |
| Mạng và GPS | Mất mạng giữa nhận cuốc, vị trí cũ, thu hồi quyền, app chạy nền rồi quay lại, mở bản đồ ngoài và quay lại. Chỉ hiển thị thành công khi server xác nhận. |
| An toàn thao tác | Test bằng một tay khi xe đã dừng, cỡ chữ lớn, TalkBack/VoiceOver, thao tác Back và màn hình có gesture navigation. Nút chính tiếp cận được và tách thao tác hủy/thu tiền khỏi chạm nhầm. |
| Giao dịch và bằng chứng | Thử lại nhận cuốc, xác nhận tiền hoặc gửi biên bản sau phản hồi muộn. Đối chiếu tọa độ đúng pha, phiên bản ảnh đúng bản ghi và số lần cập nhật thành công. |
| Ảnh chat và biên bản | Ảnh dọc/ngang, ảnh tải chậm/lỗi, pinch, pan, chạm đúp, đóng bằng Back, đổi kích cỡ màn hình. Giữ vị trí hội thoại hoặc biên bản sau khi đóng ảnh. |

**Phương pháp thu thập lại bằng chứng.** Chụp cùng dữ liệu giả trên hai theme, ghi mã phiên bản và trạng thái cho từng ảnh. Kết hợp quay video ngắn cho OTP, offer gần hết giờ, đi/đến và quay lại từ bản đồ, xác nhận tiền, chụp lại biên bản và zoom ảnh. Giữ ảnh phiên thực trong phạm vi nội bộ.

[uber-trip]: https://www.uber.com/gb/en/drive/basics/how-to-take-trips/
[uber-docs]: https://help.uber.com/driving-and-delivering/article/i-want-to-check-the-status-of-my-documents?nodeId=72a167cf-6999-4d1a-a9cf-c57d5bba3348
[uber-nav]: https://help.uber.com/so/driving-and-delivering/article/using-a-third-party-navigation-app?nodeId=d318eceb-3502-4be1-94a8-ce7249e5e5ec
[uber-earnings]: https://help.uber.com/en/driving-and-delivering/article/%D9%83%D9%8A%D9%81-%D9%8A%D8%AA%D9%85-%D8%AD%D8%B3%D8%A7%D8%A8-%D8%A7%D9%84%D8%A3%D8%AC%D8%B1%D8%A9%D8%9F?nodeId=616ff4b0-e011-49d9-965e-dccba035b81b
[uber-chat]: https://help.uber.com/driving-and-delivering/article/contacting-a-rider?nodeId=4f6cfc84-ae65-4292-ac8b-abd96d165271
[grab-onboarding]: https://www.grab.com/vn/driver/drive/
[grab-drive]: https://www.grab.com/my/driver/drive/
[grab-job]: https://www.grab.com/my/be-a-grab-driver-or-delivery-partner-today/
[grab-scheduled]: https://www.grab.com/vn/blog/driver/dattruocchuyenxe/
[grab-chat]: https://www.grab.com/vn/blog/cap-nhat-tinh-nang-grabchat/
[grab-safety]: https://www.grab.com/inside-grab/stories/drivers-and-passengers-finding-safety-tools/
[go-start]: https://int-website.gojek.com/sg/help/driver/account-and-vehicle/how-do-i-get-started
[go-faq]: https://www.gojek.com/sg/blog/new-driver-faqs
[be]: https://be.com.vn/be-rider-blog/beBike-beCar-huong-dan-ung-dung-bedriver-cho-tai-xe/
