import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { documentTypeLabel } from "@/lib/displayLabels";
import { rideStyles } from "@/components/rideStyles";
import { Button, Card, GroupedList, Typography as Text, useThemedStyles } from "@datxe/ui";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useApprovalStatus } from "../hooks/useApprovalStatus";

export default function ApprovalStatusScreen() {
  const s = useThemedStyles(rideStyles);
  const { verification: v, documents: d } = useApprovalStatus();
  const router = useRouter();
  const reload = () => Promise.all([v.refetch(), d.refetch()]);
  const approved = v.data?.verification_status === "APPROVED";
  const types = [...new Set([...(v.data?.required_document_types ?? []), ...(d.data ?? []).map((doc) => doc.document_type)])];
  const documents = types.map((type) => ({ type, document: d.data?.find((doc) => doc.document_type === type) }));
  const rank = (value?: string) => value === "APPROVED" ? 2 : value === "PENDING" ? 1 : 0;
  documents.sort((a, b) => rank(a.document?.verification_status) - rank(b.document?.verification_status));
  const needsChanges = documents.some(({ document }) => !document || document.verification_status === "REJECTED");
  const edit = (type: string) => router.push({
    pathname: type.startsWith("DRIVER_LICENSE") ? "/(auth)/license-upload" : "/(auth)/verify-id",
    params: { document: type },
  });

  return (
    <DriverPage title="Xét duyệt hồ sơ" loading={v.isLoading || d.isLoading}
      error={v.error?.message || d.error?.message} retry={reload}>
      {v.data ? (
        <Card style={s.card}>
          <Text style={s.label}>Bước 4/4 · Kết quả xét duyệt</Text>
          <StatusBadge kind="approval" value={v.data.verification_status} />
          <Text>{approved ? "Hồ sơ đã sẵn sàng. Vào Trang chủ để bật nhận chuyến."
            : d.data && needsChanges ? "Xem các giấy tờ cần bổ sung hoặc thay ảnh bên dưới."
            : "Bạn có thể kiểm tra lại kết quả tại đây sau khi hồ sơ được xem xét."}</Text>
          {v.data.unverified_skills.length ? <Text style={s.label}>{v.data.unverified_skills.length} kỹ năng chưa được duyệt</Text> : null}
          {approved ? <Button label="Vào trang chủ" onPress={() => router.replace("/(tabs)/home")} /> : null}
        </Card>
      ) : null}
      {documents.length && d.data ? (
        <GroupedList title="Checklist giấy tờ">
          {documents.map(({ type, document }) => (
            <View key={type} style={styles.row}>
              <Text style={s.text}>{documentTypeLabel(type)}</Text>
              {document ? <StatusBadge kind="documentReview" value={document.verification_status} />
                : <Text style={s.label}>Chưa nộp</Text>}
              {document?.rejection_reason ? <Text style={s.error}>{document.rejection_reason}</Text> : null}
              {document?.expires_at ? <Text style={s.label}>Hạn trên giấy tờ · {new Date(`${document.expires_at.slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN")}</Text> : null}
              {!document || document.verification_status === "REJECTED" ? (
                <Button variant="ghost" label={document ? "Sửa giấy tờ" : "Bổ sung giấy tờ"}
                  accessibilityLabel={`Cập nhật ${documentTypeLabel(type)}`} onPress={() => edit(type)} />
              ) : null}
            </View>
          ))}
        </GroupedList>
      ) : null}
      <Button variant="secondary" label="Kiểm tra lại kết quả" loading={v.isFetching || d.isFetching}
        onPress={() => void reload()} />
    </DriverPage>
  );
}

const styles = StyleSheet.create({ row: { gap: 8, paddingVertical: 8 } });
