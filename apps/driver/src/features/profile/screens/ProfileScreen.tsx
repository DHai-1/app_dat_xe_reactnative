import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { walletTransactionLabel } from "@/lib/displayLabels";
import { rideStyles as s } from "@/components/rideStyles";
import { useSessionStore } from "@/lib/store";
import { formatMoney, signOutFirebase } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { Alert, View } from "react-native";
import { useProfile } from "../hooks/useProfile";
export default function DriverProfileScreen() {
  const themed_s = useThemedStyles(s);
  const { profile: p, verification: v, wallet: w } = useProfile();
  const user = useSessionStore((state) => state.user),
    router = useRouter();
  const logout = () =>
    Alert.alert("Đăng xuất?", "Bạn muốn kết thúc phiên đăng nhập?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: () => {
          void signOutFirebase()
            .then(() => router.replace("/(auth)/login"))
            .catch((error) =>
              Alert.alert("Không thể đăng xuất", error.message),
            );
        },
      },
    ]);
  return (
    <DriverPage
      title="Hồ sơ tài xế"
      tabs
      loading={p.isLoading || v.isLoading || w.isLoading}
      error={p.error?.message || v.error?.message || w.error?.message}
      retry={() => Promise.all([p.refetch(), v.refetch(), w.refetch()])}
    >
      <Card style={themed_s.card}>
        <Text style={themed_s.title}>{user?.fullName ?? "Tài xế"}</Text>
        <Text style={themed_s.text}>
          {user?.phoneNumber ?? "Chưa có số điện thoại"}
        </Text>
        {p.data ? (
          <>
            <Text style={themed_s.text}>
              GPLX: {p.data.license_number ?? "Chưa cập nhật"} ·{" "}
              {p.data.license_class ?? "Chưa cập nhật"}
            </Text>
            <Text style={themed_s.text}>
              Kinh nghiệm:{" "}
              {p.data.years_of_experience === null
                ? "Chưa cập nhật"
                : p.data.years_of_experience + " năm"}
            </Text>
          </>
        ) : null}
        {v.data ? (
          <StatusBadge kind="approval" value={v.data.verification_status} contextLabel="Xét duyệt hồ sơ" />
        ) : null}
        <Pressable onPress={() => router.push("/(auth)/license-upload")}>
          <Text style={themed_s.link}>Cập nhật giấy phép lái xe</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/verify-id")}>
          <Text style={themed_s.link}>Cập nhật căn cước và ảnh chân dung</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/approval-status")}>
          <Text style={themed_s.link}>Xem kết quả xét duyệt</Text>
        </Pressable>
        <Button label="Trợ giúp · Gửi yêu cầu hỗ trợ" variant="secondary" onPress={() => router.push('/support')} />
      </Card>
      {w.data ? (
        <>
          <Card style={themed_s.card}>
            <Text style={themed_s.label}>SỐ DƯ THU NHẬP</Text>
            <Text style={themed_s.title}>
              {formatMoney(w.data.income_balance)}
            </Text>
          </Card>
          <Text style={themed_s.title}>Giao dịch ví</Text>
          {w.data.wallet_transactions.map((t) => (
            <View key={t.id} style={themed_s.card}>
              <Text style={themed_s.text}>{walletTransactionLabel(t.type)}</Text>
              {t.description && t.description !== t.type ? <Text style={themed_s.text}>{t.description}</Text> : null}
              <Text style={themed_s.text}>{formatMoney(t.amount)}</Text>
              <Text style={themed_s.label}>
                {new Date(t.created_at).toLocaleString("vi-VN")}
              </Text>
              {t.ride_id ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/ride/complete",
                      params: { rideId: String(t.ride_id) },
                    })
                  }
                >
                  <Text style={themed_s.link}>Xem chuyến #{t.ride_id}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {!w.data.wallet_transactions.length ? (
            <Text style={themed_s.text}>Chưa có giao dịch.</Text>
          ) : null}
        </>
      ) : null}
      <Button
        style={themed_s.button}
        onPress={logout}
        label={"Đăng xuất"}
        textStyle={themed_s.buttonText}
      />
    </DriverPage>
  );
}
