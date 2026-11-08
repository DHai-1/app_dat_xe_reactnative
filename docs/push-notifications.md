# Push Android/iOS — Customer và Driver

Cập nhật 05/11/2026. Áp dụng cho code frontend và backend mới; chưa xác nhận E2E trên thiết bị với bản native mới.

## Hành vi đã triển khai

- Hai app dùng `index.js` để đăng ký Firebase background handler trước Expo Router. FCM token vẫn đăng ký với backend qua installation ID như trước.
- Server gửi **notification + data**: Android/APNs tự hiển thị khi app ở nền/đã đóng, không phụ thuộc JS có được đánh thức hay không. Background handler không tạo thêm local notification nếu FCM đã có phần `notification`.
- Data-only từ server cũ có local notification dự phòng khi OS gọi background handler. Đây không phải đường đảm bảo hiển thị trên iOS; cần triển khai backend mới để có alert APNs.
- Foreground dùng local banner, âm thanh mặc định và chống trùng bằng `messageId`. Driver nhận cả STOMP lẫn FCM với cùng ID; chỉ một banner và một lần tự mở offer cho mỗi sự kiện. Một lần người dùng bấm banner là hành động riêng, vẫn kiểm tra offer hiện tại.
- Android có hai channel: `datxe-offers-v1` (MAX, tiếng mặc định, rung cho offer) và `datxe-updates-v1` (HIGH, tiếng/rung cho chuyến/chat). Âm thanh/rung tuân theo quyền, cài đặt channel và chế độ im lặng của thiết bị; ứng dụng không ép vượt DND.
- iOS dùng âm thanh APNs mặc định. Không bật critical alert. Foreground presentation của RNFirebase được tắt trong `firebase.json` để tránh trùng với local banner.
- Nội dung màn khóa dùng mô tả chung; không đưa nội dung chat, địa chỉ hoặc giấy tờ vào title/body.
- Khi mở từ notification: xử lý callback FCM lẫn callback Expo cho local notification; đọc cả cold-start notification và tap đã lưu. Hàng đợi đợi account backend được khôi phục, router mount xong và rời màn khởi động/đăng nhập rồi mới điều hướng.
- Payload không được chỉ định URL tùy ý. App chọn route từ whitelist nghiệp vụ, tải dữ liệu bằng API của account hiện tại; `recipientRole`/`recipientId` sai account bị bỏ qua.
- Tap đã xử lý được ghi nhớ để không mở lặp sau remount/khởi động lại. Lỗi mạng giữ tap để thử lại. Đổi account/đăng xuất khi API đang chạy không được điều hướng bằng kết quả cũ.
- iOS headless launch không dựng các bridge auth/GPS/router cho tới khi app thực sự hiện ra.
- Khi app active trở lại: làm mới query của account. Driver đồng thời dọn offer notification đã hết hạn; khi nhận/bỏ qua offer hoặc nhận sự kiện đóng offer sẽ dọn notification tương ứng.

## Kiểm tra offer trước điều hướng

`RIDE_OFFER` luôn gọi `GET /driver/offers/pending` và so khớp `rideId` của thông báo với offer hiện tại, kiểm tra `expiresAt > Date.now()` sau khi API trả về.

- Còn offer đúng chuyến: mở `/ride/accept?rideId=...`.
- Chuyến đó đã được nhận và còn active: mở chuyến đang chạy.
- Hết hạn, bị hủy hoặc pending đã chuyển sang chuyến khác: về Home và giải thích yêu cầu không còn khả dụng; không mở offer mới bằng thông báo cũ.
- Màn Accept cũng khóa theo `rideId`, refetch khi mount và kiểm tra thời gian thực tại thời điểm bấm nhận; backend tiếp tục là nơi quyết định việc nhận chuyến.

TTL của FCM và `apns-expiration` chặn lưu/gửi offer quá hạn trong hàng đợi vận chuyển. **TTL không tự xóa notification đã giao khỏi khay thông báo.** App dọn khi trở lại foreground và kiểm tra lại server khi bấm, kể cả notification còn nằm trong khay sau hết hạn.

## Thay đổi backend tại `D:\datxebackend`

- `notification/channel/FcmMessageFactory.kt`: tạo title/body hiển thị, giữ envelope trong `data.payload`, thêm recipient role/ID, channel và âm thanh Android; APNs alert priority 10, sound, content-available, expiration.
- Offer: không gửi nếu đã hết hạn/thiếu deadline; Android TTL bằng phần thời gian còn lại; APNs expiration dùng deadline của offer. Thông báo thường có TTL một giờ.
- Các sự kiện người dùng cần thấy dùng `PUSH_ALSO`, gồm offer, thay đổi chuyến, bàn giao, xét duyệt và chat. Có socket không đồng nghĩa người dùng đang nhìn màn hình.
- `ChatPushListener` gửi FCM cả khi STOMP thành công, dùng cùng envelope ID cho cả hai kênh. `CHAT_READ` và các sự kiện điều khiển offer vẫn chỉ dùng WS.
- Chưa triển khai backend lên môi trường đang chạy trong phiên làm việc này. Cần cập nhật server cùng bản app để hoàn thiện luồng.

## Build và cấu hình thiết bị

Đã thêm `expo-notifications` theo Expo SDK 58, plugin và `firebase.json` trong từng app. **Cần rebuild development client**; Metro reload/OTA không cài được module native mới.

```powershell
cd D:\datxe_rn
npm ci
npm run android -w driver
npm run android -w customer
```

Hai app dùng chung thư mục `node_modules` và build của một số native dependency; chạy hai build Android tuần tự để tránh tranh chấp file trên Windows.

Android: cần `google-services.json` đúng application ID, thiết bị có Google Play Services và quyền POST_NOTIFICATIONS trên Android 13+. Không dùng Expo Go để xác nhận luồng này.

iOS: cần `GoogleService-Info.plist` cho từng bundle ID, APNs key/certificate trong Firebase project, provisioning có Push Notifications và bản native mới trên iPhone thật. Plugin sinh `aps-environment` và `UIBackgroundModes: remote-notification`. `aps-environment` của bản ký production phải khớp provisioning production. Trong workspace hiện tại **cả hai file plist iOS đều chưa có** nên chưa kiểm tra full iOS config/native build.

Không đổi notification channel ID đã phát hành chỉ để bật lại âm thanh người dùng đã tắt. Muốn xác nhận tiếng/rung cần kiểm tra cài đặt notification của từng app trên thiết bị.

## Bằng chứng kiểm tra trong phiên này

| Kiểm tra | Kết quả |
| --- | --- |
| Test logic frontend: parser, audience, expiry, route, đợi phiên/router, duplicate, retry, sign-out race | Đạt. |
| Test local Android: tạo channel, âm thanh/rung, một banner cho nhiều nguồn | Đạt bằng native adapter giả lập. |
| Test local iOS: immediate local notification, không gọi Android channel API | Đạt bằng native adapter giả lập. |
| Test tap persistence/cold-start response và bỏ qua dismiss | Đạt. |
| Plugin notification trên config riêng hai app | Đạt: Android channel metadata, iOS APNs entitlement/background mode. |
| Expo prebuild Android hai app | Đạt. |
| Gradle `:app:processDebugMainManifest` hai app | Đạt; Customer chạy lại tuần tự sau tranh chấp thư mục Reanimated dùng chung. |
| Android JS bundle hai app (`expo export --no-bytecode`) | Đạt; không tương đương build/install APK hoặc đo delivery thật. |
| iOS JS bundle hai app (`expo export --no-bytecode`) | Đạt; không tương đương ký/build native iOS hoặc xác nhận APNs trên iPhone. |
| Backend notification/chat tests | 16 test đạt, gồm 3 test FCM mới về payload/TTL/APNs. |
| Push Android qua FCM trên bản native mới | Chưa chạy E2E. Đã phát hiện thiết bị Android kết nối, chưa cài đè app hoặc gửi push thử vào thiết bị. |
| Push iOS thực tế | Chưa chạy; thiếu plist/provisioning và môi trường native iOS. |

## Ma trận nghiệm thu trên thiết bị thật

Các dòng dưới đây là kế hoạch QA, **chưa đánh dấu đã kiểm chứng thực tế**.

| Tình huống | Android | iOS | Kết quả cần đạt |
| --- | --- | --- | --- |
| App foreground, STOMP + FCM cùng offer | Chưa chạy | Chưa chạy | Một banner/âm thanh; mở đúng offer còn hạn, không hai màn Accept. |
| Background, khóa màn hình | Chưa chạy | Chưa chạy | OS hiển thị một thông báo; tiếng/rung theo thiết lập; bấm mở đúng chuyến. |
| App process đã đóng, user còn phiên Firebase | Chưa chạy | Chưa chạy | Tap mở app, hoàn tất khôi phục phiên/backend rồi mới điều hướng. |
| Đã đăng xuất hoặc phiên hết hạn | Chưa chạy | Chưa chạy | Chờ login; không gọi API chuyến bằng phiên rỗng; sau login chỉ mở nếu đúng recipient. |
| Offer hết hạn khi app đang mở lại | Chưa chạy | Chưa chạy | Không hiện offer cũ như còn nhận được; giải thích rõ. |
| Pending hiện là chuyến B, tap thông báo chuyến A | Chưa chạy | Chưa chạy | Không tự mở B dưới danh nghĩa thông báo A. |
| Nhận chuyến trên thiết bị khác trước khi tap | Chưa chạy | Chưa chạy | Dùng active ride/server status mới nhất. |
| Mất mạng lúc tap/khôi phục | Chưa chạy | Chưa chạy | Có Thử lại, không mất target hoặc điều hướng sai. |
| Bấm chat/hoàn tất/hủy/xét duyệt | Chưa chạy | Chưa chạy | Đúng route và đúng mã chuyến, dữ liệu được kiểm tra bằng API. |
| Từ chối quyền/tắt channel/im lặng | Chưa chạy | Chưa chạy | Không crash; dữ liệu cập nhật khi mở app; không cố vượt quyền/thiết lập OS. |
| Đổi account khi notification còn trong khay | Chưa chạy | Chưa chạy | Không mở dữ liệu account cũ; notification/pending được dọn khi logout. |
| Force-stop Android / tắt Background App Refresh iOS | Chưa chạy | Chưa chạy | Ghi nhận giới hạn OS; không coi data-only callback là bảo đảm hiển thị. |

Tham chiếu: [Expo Notifications SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/), [RNFirebase Messaging](https://rnfirebase.io/messaging/usage), [FCM message lifetime](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan), [FCM trên iOS](https://firebase.google.com/docs/cloud-messaging/ios/receive-messages).
