import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel } from "@/lib/displayLabels";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useApprovalStatus } from "../hooks/useApprovalStatus";
export default function ApprovalStatusScreen() {
  const themed_s = useThemedStyles(s);
  const { verification: v, documents: d } = useApprovalStatus(),
    router = useRouter();
  return (
    <DriverPage
      title="Xét duyệt hồ sơ"
      loading={v.isLoading || d.isLoading}
      error={v.error?.message || d.error?.message}
      retry={() => Promise.all([v.refetch(), d.refetch()])}
    >
      {v.data ? (
        <Card style={themed_s.card}>
          <Text style={themed_s.title}>
            Kết quả xét duyệt hồ sơ
          </Text>
          <StatusBadge kind="approval" value={v.data.verification_status} />
          {v.data.missing_documents.length ? (
            <Text style={themed_s.text}>
              Giấy tờ chưa được duyệt: {v.data.missing_documents.map(documentTypeLabel).join(", ")}
            </Text>
          ) : null}
          {v.data.unverified_skills.length ? (
            <Text style={themed_s.text}>
              Có {v.data.unverified_skills.length} kỹ năng đang chờ duyệt.
            </Text>
          ) : null}
        </Card>
      ) : null}
      {d.data?.map((doc) => (
        <View key={doc.id} style={themed_s.card}>
          <Text style={themed_s.text}>
            {documentTypeLabel(doc.document_type)}
          </Text>
          <Text style={themed_s.label}>Mã giấy tờ #{doc.id}</Text>
          <StatusBadge kind="documentReview" value={doc.verification_status} contextLabel="Xét duyệt giấy tờ" />
          {doc.rejection_reason ? (
            <Text style={themed_s.error}>{doc.rejection_reason}</Text>
          ) : null}
        </View>
      ))}
      <Pressable onPress={() => router.push("/(auth)/license-upload")}>
        <Text style={themed_s.link}>Cập nhật GPLX và kỹ năng</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(auth)/verify-id")}>
        <Text style={themed_s.link}>Cập nhật căn cước</Text>
      </Pressable>
      {v.data?.verification_status === "APPROVED" ? (
        <Button
          style={themed_s.button}
          onPress={() => router.replace("/(tabs)/home")}
          label={"Vào trang chủ"}
          textStyle={themed_s.buttonText}
        />
      ) : null}
    </DriverPage>
  );
}
