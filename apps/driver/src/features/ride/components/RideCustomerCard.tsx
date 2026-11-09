import { DriverChatButton } from "@/components/DriverChatButton";
import type { CustomerRideDetail } from "@datxe/shared";
import { Button, Card, Typography as Text, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Dialog, Portal } from "react-native-paper";

export function RideCustomerCard({ ride }: { ride: CustomerRideDetail }) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [callError, setCallError] = useState("");
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const customer = ride.customer;
  const name = customer?.fullName?.trim() || "Khách hàng";
  const phone = customer?.phoneNumber?.trim();
  const dialNumber = phone?.replace(/[\s().-]/g, "") ?? "";
  const canCall = /^\+?\d{3,15}$/.test(dialNumber);
  const avatarUrl = customer?.avatarUrl;
  const hasAvatar = Boolean(avatarUrl && avatarUrl !== failedAvatar);
  const avatarColors = { backgroundColor: colors.primaryContainer };

  const avatar = (size: number) => hasAvatar && avatarUrl ? (
    <Avatar.Image size={size} source={{ uri: avatarUrl }} onError={() => setFailedAvatar(avatarUrl)} />
  ) : (
    <Avatar.Icon size={size} icon="account" color={colors.onPrimaryContainer} style={avatarColors} />
  );

  const close = () => {
    setCallError("");
    setVisible(false);
  };

  const call = async () => {
    if (!canCall) return;
    setCallError("");
    try {
      await Linking.openURL(`tel:${dialNumber}`);
    } catch {
      setCallError("Chưa mở được ứng dụng điện thoại. Bạn có thể nhắn tin cho khách.");
    }
  };

  return (
    <>
      <Card
        onPress={() => setVisible(true)}
        accessibilityLabel={`Xem thông tin khách hàng, ${name}`}
        style={styles.summary}
      >
        {avatar(48)}
        <View style={styles.identity}>
          <Text style={{ color: colors.onSurfaceVariant }}>Khách hàng</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
      </Card>
      <Portal>
        <Dialog visible={visible} onDismiss={close} style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: 28 }}>
          <Dialog.Title>Thông tin khách hàng</Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView contentContainerStyle={styles.details}>
              {avatar(64)}
              <Text style={styles.name}>{name}</Text>
              <View style={styles.contact}>
                <Text style={{ color: colors.onSurfaceVariant }}>Số điện thoại</Text>
                <Text selectable>{phone || "Chưa có số điện thoại"}</Text>
              </View>
              <View style={styles.contact}>
                <Text style={{ color: colors.onSurfaceVariant }}>Email</Text>
                <Text selectable>{customer?.email?.trim() || "Chưa có email"}</Text>
              </View>
              {customer?.averageRating != null ? (
                <Text>Đánh giá · {customer.averageRating.toLocaleString("vi-VN")} / 5</Text>
              ) : null}
              <Button label="Gọi điện" icon="call" iconPosition="leading" disabled={!canCall} onPress={() => void call()} />
              <DriverChatButton ride={ride} onOpen={close} />
              {callError ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{callError}</Text> : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button label="Đóng" variant="ghost" onPress={close} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", alignItems: "center", gap: 12 },
  identity: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "600" },
  scrollArea: { paddingHorizontal: 0, borderTopWidth: 0, borderBottomWidth: 0 },
  details: { paddingHorizontal: 24, paddingVertical: 8, gap: 12 },
  contact: { gap: 4 },
});
