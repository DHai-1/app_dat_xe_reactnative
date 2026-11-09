import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { logError } from "@/lib/logger";
import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { useSessionStore } from "@/lib/store";
import { formatMoney, signOutFirebase } from "@datxe/shared";
import {
  Card,
  GroupedList,
  SettingsListItem,
  Typography as Text,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Avatar, Divider, IconButton } from "react-native-paper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteDriverAccount } from "../api";
import { useProfile } from "../hooks/useProfile";
export default function DriverProfileScreen() {
  const themed_s = useThemedStyles(s);
  const { profile: p, verification: v, wallet: w } = useProfile();
  const user = useSessionStore((state) => state.user);
  const activeRide = useSessionStore((state) => state.activeRide);
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const [confirmation, setConfirmation] = useState<{ type: "logout" | "delete"; userId: number } | null>(null);
  const accountAction = useMutation({
    mutationFn: async ({ type, userId }: NonNullable<typeof confirmation>) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      if (type === "delete") {
        await deleteDriverAccount();
        if (useSessionStore.getState().user?.id === userId) await signOutFirebase().catch(logError);
      } else await signOutFirebase();
    },
    onSuccess: (_, { userId }) => {
      const current = useSessionStore.getState().user;
      if (current && current.id !== userId) return;
      useSessionStore.getState().reset();
      client.clear();
      router.replace("/(auth)/login");
    },
  });
  const openConfirmation = (type: "logout" | "delete") => {
    if (!user) return;
    accountAction.reset();
    setConfirmation({ type, userId: user.id });
  };
  const initials = user?.fullName?.trim().split(/\s+/).slice(-2).map((word) => word[0]).join("").toUpperCase() || "TX";
  const deleting = confirmation?.type === "delete";
  return (
    <DriverPage
      title="Hồ sơ tài xế"
      tabs
      loading={p.isLoading || v.isLoading || w.isLoading}
      error={p.error?.message || v.error?.message || w.error?.message}
      retry={() => Promise.all([p.refetch(), v.refetch(), w.refetch()])}
    >
      <Card style={themed_s.card}>
        <View style={layout.identity}>
          <Avatar.Text size={48} label={initials} color={colors.onPrimaryContainer} style={{ backgroundColor: colors.primaryContainer }} />
          <Text style={[themed_s.title, layout.name]}>{user?.fullName ?? "Tài xế"}</Text>
          <IconButton
            icon="pencil"
            iconColor={colors.primary}
            style={layout.edit}
            accessibilityLabel="Xem và sửa thông tin cá nhân"
            onPress={() => router.push("/profile/edit")}
          />
        </View>
        <View style={layout.contactRow}>
          <MaterialIcons name="call" size={18} color={colors.onSurfaceVariant} importantForAccessibility="no" />
          <Text style={[themed_s.text, layout.contact]}>{user?.phoneNumber ?? "Chưa có số điện thoại"}</Text>
        </View>
        {user?.email ? (
          <View style={layout.contactRow}>
            <MaterialIcons name="mail-outline" size={18} color={colors.onSurfaceVariant} importantForAccessibility="no" />
            <Text
              style={[themed_s.text, layout.contact]}
              accessibilityLabel={`Email: ${user.email}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              ellipsizeMode="tail"
            >
              {user.email}
            </Text>
          </View>
        ) : null}
        {p.data || v.data ? <Divider style={{ backgroundColor: colors.outlineVariant }} /> : null}
        {p.data ? (
          <>
            <Text style={themed_s.text}>
              Hạng GPLX · {p.data.license_class ?? "Chưa cập nhật"}
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
          <StatusBadge
            kind="approval"
            value={v.data.verification_status}
            contextLabel="Xét duyệt hồ sơ"
          />
        ) : null}
      </Card>
      <GroupedList title="Hồ sơ & hỗ trợ">
        <SettingsListItem title="Cài đặt" icon="settings" onPress={() => router.push("/settings")} />
        <SettingsListItem
          title="Cập nhật giấy phép lái xe"
          icon="badge"
          onPress={() => router.push("/(auth)/license-upload")}
        />
        <SettingsListItem
          title="Cập nhật căn cước và ảnh chân dung"
          icon="account-box"
          onPress={() => router.push("/(auth)/verify-id")}
        />
        <SettingsListItem
          title="Xem kết quả xét duyệt"
          icon="verified-user"
          onPress={() => router.push("/(auth)/approval-status")}
        />
        <SettingsListItem
          title="Trợ giúp · Gửi yêu cầu hỗ trợ"
          icon="help-outline"
          onPress={() => router.push("/support")}
        />
        <SettingsListItem title="An toàn chuyến đi" icon="health-and-safety" onPress={() => router.push("/safety")} />
      </GroupedList>
      <GroupedList title="Thu nhập">
        <SettingsListItem title="Ví thu nhập" icon="account-balance-wallet"
          description={w.data ? `Số dư · ${formatMoney(w.data.income_balance)}` : "Xem số dư và giao dịch"}
          onPress={() => router.push("/profile/wallet")} />
      </GroupedList>
      <GroupedList title="Tài khoản">
        <SettingsListItem title="Đăng xuất" icon="logout" disabled={!user} onPress={() => openConfirmation("logout")} />
        <SettingsListItem title="Xóa tài khoản" icon="delete-outline" destructive disabled={!user} onPress={() => openConfirmation("delete")} />
      </GroupedList>
      <DriverConfirmationDialog
        visible={Boolean(confirmation)} busy={accountAction.isPending}
        title={deleting ? "Xóa tài khoản?" : "Đăng xuất?"}
        description={deleting
          ? "Hồ sơ và giấy tờ sẽ được xóa hoặc ẩn danh. Lịch sử chuyến được giữ lại. Bạn cần kết thúc chuyến đang hoạt động trước khi xóa tài khoản."
          : "Bạn sẽ cần đăng nhập lại để tiếp tục nhận chuyến."}
        confirmLabel={deleting ? "Xóa tài khoản" : "Đăng xuất"}
        dismissLabel={deleting ? "Giữ tài khoản" : "Ở lại"}
        disabled={deleting && Boolean(activeRide)}
        error={accountAction.error?.message}
        onDismiss={() => setConfirmation(null)}
        onConfirm={() => { if (confirmation) accountAction.mutate(confirmation); }}
      />
    </DriverPage>
  );
}

const layout = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  name: { flex: 1, alignSelf: "center", fontWeight: "700" },
  edit: { margin: 0, width: 48, height: 48 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contact: { flex: 1, fontSize: 14 },
});
