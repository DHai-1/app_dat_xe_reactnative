import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { Button, ScreenWrapper as SafeAreaView, spacing, Typography as Text, typography, useLanguage, useThemedStyles } from "@datxe/ui";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocumentProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  otherDocumentTitle: string;
  otherDocumentPath: "/terms-of-service" | "/privacy-policy";
};

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Dịch vụ PtitGo",
    paragraphs: [
      "Ứng dụng hỗ trợ khách hàng gửi yêu cầu lái xe hộ, theo dõi trạng thái chuyến và trao đổi với tài xế trong phạm vi các tính năng đang có. Việc ghép tài xế phụ thuộc vào khu vực, thời điểm và tình trạng hoạt động của dịch vụ.",
    ],
  },
  {
    title: "2. Tài khoản và thông tin",
    paragraphs: [
      "Bạn cần cung cấp thông tin chính xác, giữ an toàn thông tin đăng nhập và chỉ sử dụng tài khoản của mình. Vui lòng cập nhật hồ sơ khi thông tin thay đổi và không dùng ứng dụng để giả mạo, quấy rối hoặc thực hiện hành vi trái pháp luật.",
    ],
  },
  {
    title: "3. Gửi yêu cầu chuyến",
    paragraphs: [
      "Trước khi xác nhận, hãy kiểm tra điểm đón, điểm đến, xe đã chọn, thời gian đặt lịch và ghi chú. Ứng dụng hiển thị ước tính giá trước khi gửi yêu cầu; giá và trạng thái chuyến được cập nhật trong ứng dụng theo dữ liệu chuyến.",
      "Hiện tại ứng dụng hỗ trợ thanh toán tiền mặt. Mã ưu đãi chỉ áp dụng khi đáp ứng điều kiện được hiển thị trong ứng dụng.",
    ],
  },
  {
    title: "4. Thay đổi hoặc hủy chuyến",
    paragraphs: [
      "Khả năng thay đổi hoặc hủy phụ thuộc vào trạng thái chuyến. Hãy làm theo lựa chọn được hiển thị trong ứng dụng; các khoản phí hoặc cách xử lý liên quan, nếu có, sẽ theo thông tin áp dụng cho chuyến tại thời điểm thao tác.",
    ],
  },
  {
    title: "5. Sử dụng an toàn và phù hợp",
    bullets: [
      "Cung cấp địa chỉ và thông tin xe đúng với chuyến đi.",
      "Không gửi nội dung đe dọa, xúc phạm, gian lận hoặc xâm phạm quyền của người khác.",
      "Không can thiệp, gây quá tải hoặc tìm cách truy cập trái phép vào ứng dụng và tài khoản khác.",
    ],
  },
  {
    title: "6. Tính sẵn sàng và hỗ trợ khẩn cấp",
    paragraphs: [
      "Dịch vụ có thể gián đoạn do kết nối, bảo trì hoặc không có tài xế phù hợp. Ứng dụng hiện không cung cấp hotline hay chức năng gửi SOS, vì vậy không thay thế dịch vụ ứng cứu khẩn cấp.",
    ],
  },
  {
    title: "7. Tạm ngừng và xóa tài khoản",
    paragraphs: [
      "Tài khoản có thể bị giới hạn khi phát hiện dấu hiệu gian lận, mất an toàn hoặc vi phạm điều khoản. Bạn có thể yêu cầu xóa tài khoản từ mục Hồ sơ; một số lịch sử chuyến và giao dịch có thể được giữ lại theo quy trình của dịch vụ.",
    ],
  },
  {
    title: "8. Cập nhật điều khoản",
    paragraphs: [
      "Điều khoản có thể được cập nhật khi dịch vụ thay đổi. Phiên bản hiện hành sẽ được đăng trên màn hình này; vui lòng xem lại trước khi tiếp tục sử dụng các tính năng liên quan.",
    ],
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Dữ liệu ứng dụng xử lý",
    bullets: [
      "Tài khoản và hồ sơ: số điện thoại đã xác minh, họ tên, email, ngày sinh, giới tính và ảnh hồ sơ nếu bạn cung cấp.",
      "Thông tin chuyến: địa chỉ và tọa độ điểm đón/đến, thời gian, xe đã chọn, ghi chú, giá, phương thức thanh toán, trạng thái và lịch sử chuyến.",
      "Nội dung bạn gửi: tin nhắn và hình ảnh trong hồ sơ, xe hoặc cuộc trò chuyện khi bạn sử dụng các tính năng đó.",
      "Dữ liệu vận hành cần thiết cho đăng nhập và thông báo, như mã định danh Firebase và token thiết bị.",
    ],
  },
  {
    title: "2. Mục đích sử dụng",
    paragraphs: [
      "Dữ liệu được dùng để xác thực tài khoản, tạo và điều phối chuyến, tính lộ trình và giá, hiển thị lịch sử, gửi thông báo, hỗ trợ xử lý sự cố và bảo vệ an toàn tài khoản. Địa chỉ và tọa độ của chuyến được gửi đến dịch vụ bản đồ để xử lý định tuyến hoặc mã hóa địa chỉ khi cần.",
    ],
  },
  {
    title: "3. Chia sẻ với bên liên quan",
    paragraphs: [
      "Thông tin cần thiết của chuyến được chia sẻ với tài xế được ghép để hoàn thành chuyến. Nhân sự quản trị có thể truy cập dữ liệu cần thiết để vận hành dịch vụ, xử lý tranh chấp và bảo đảm an toàn.",
      "Ứng dụng sử dụng nhà cung cấp kỹ thuật cho xác thực và thông báo (Firebase), bản đồ (Goong) và lưu trữ hình ảnh (Cloudinary) khi bạn dùng các tính năng tương ứng. Dữ liệu cũng có thể được cung cấp khi pháp luật yêu cầu.",
    ],
  },
  {
    title: "4. Vị trí và quyền thiết bị",
    paragraphs: [
      "Trong luồng đặt chuyến hiện tại, bạn nhập địa chỉ và ứng dụng xử lý tọa độ tương ứng để tính lộ trình. Ứng dụng không yêu cầu quyền theo dõi vị trí nền của khách hàng. Việc chọn ảnh hồ sơ, xe hoặc ảnh chat chỉ diễn ra khi bạn chủ động sử dụng chức năng tải ảnh.",
    ],
  },
  {
    title: "5. Lưu giữ và xóa dữ liệu",
    paragraphs: [
      "Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ và thực hiện các mục đích nêu trên. Khi xóa tài khoản, thông tin hồ sơ được ẩn danh hoặc xóa theo quy trình; lịch sử chuyến và giao dịch có thể được giữ lại. Ảnh do ứng dụng quản lý sẽ được đưa vào quy trình xóa tương ứng.",
    ],
  },
  {
    title: "6. Quyền của bạn",
    paragraphs: [
      "Bạn có thể xem và cập nhật một số thông tin tại mục Hồ sơ, hoặc yêu cầu xóa tài khoản trong ứng dụng. Bạn cũng có các quyền đối với dữ liệu cá nhân theo quy định pháp luật hiện hành, gồm yêu cầu truy cập, chỉnh sửa, xóa hoặc rút lại sự đồng ý trong phạm vi áp dụng.",
    ],
  },
  {
    title: "7. Bảo vệ và thay đổi chính sách",
    paragraphs: [
      "Ứng dụng áp dụng các biện pháp kỹ thuật và vận hành phù hợp để hạn chế truy cập hoặc sử dụng dữ liệu trái phép. Chính sách này có thể được cập nhật khi tính năng hoặc quy định thay đổi; phiên bản hiện hành được đăng trên màn hình này.",
    ],
  },
];

export function TermsOfServiceScreen() {
  useLanguage();

  const router = useRouter();
  return (
    <LegalDocumentScreen
      title={i18nT("Điều khoản dịch vụ")}
      intro={i18nT(
        "Điều khoản này áp dụng khi bạn truy cập hoặc sử dụng ứng dụng khách hàng PtitGo. Vui lòng đọc kỹ trước khi tạo tài khoản hoặc gửi yêu cầu chuyến.",
      )}
      sections={TERMS_SECTIONS}
      otherDocumentTitle={i18nT("Chính sách bảo mật")}
      otherDocumentPath="/privacy-policy"
      onBack={() => router.back()}
    />
  );
}

export function PrivacyPolicyScreen() {
  useLanguage();

  const router = useRouter();
  return (
    <LegalDocumentScreen
      title={i18nT("Chính sách bảo mật")}
      intro={i18nT(
        "Chính sách này mô tả dữ liệu khách hàng PtitGo xử lý, lý do sử dụng và cách bạn quản lý một số thông tin trong ứng dụng.",
      )}
      sections={PRIVACY_SECTIONS}
      otherDocumentTitle={i18nT("Điều khoản dịch vụ")}
      otherDocumentPath="/terms-of-service"
      onBack={() => router.back()}
    />
  );
}

function LegalDocumentScreen({
  title,
  intro,
  sections,
  otherDocumentTitle,
  otherDocumentPath,
  onBack,
}: LegalDocumentProps & { onBack: () => void }) {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader title={i18nT(title)} onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>
          {i18nT("Cập nhật lần cuối: 23/10/2026")}
        </Text>
        <Text style={styles.intro}>{i18nT(intro)}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{i18nT(section.title)}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>
                {i18nT(paragraph)}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={[styles.body, styles.bulletText]}>
                  {i18nT(bullet)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.otherDocument}>
          <Text style={styles.otherDocumentText}>
            {i18nT("Bạn cũng có thể xem")}
          </Text>
          <Button variant="secondary" label={i18nT(otherDocumentTitle)} onPress={() => router.push(otherDocumentPath)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceMd,
      paddingBottom: spacing.spaceXl,
      gap: spacing.spaceLg,
    },
    updated: { ...typography.labelSm, fontSize: 13, color: colors.onSurfaceVariant },
    intro: {
      ...typography.bodyLg,
      color: colors.onSurface,
      backgroundColor: colors.primaryFixedTint,
      padding: 16,
      borderRadius: 24,
    },
    section: { gap: spacing.spaceSm },
    sectionTitle: { ...typography.headlineSm, color: colors.onSurface },
    body: {
      ...typography.bodyLg,
      color: colors.onSurfaceVariant,
      lineHeight: 24,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.spaceSm,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 24,
      backgroundColor: colors.primary,
      marginTop: spacing.spaceSm,
    },
    bulletText: { flex: 1 },
    otherDocument: {
      gap: 8,
      paddingTop: spacing.spaceSm,
    },
    otherDocumentText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  });
