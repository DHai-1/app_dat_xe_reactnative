import { DriverPage } from "@/components/DriverPage";
import { Button, Card, Typography as Text, useThemeColors } from "@datxe/ui";
import { useState } from "react";
import { Linking, StyleSheet } from "react-native";

const emergencyNumber = "112";

export default function DriverSafetyScreen() {
  const colors = useThemeColors();
  const [error, setError] = useState("");
  const openPhone = async () => {
    setError("");
    try {
      await Linking.openURL(`tel:${emergencyNumber}`);
    } catch {
      setError(`Chưa mở được ứng dụng điện thoại. Hãy quay số ${emergencyNumber} trên điện thoại tại Việt Nam.`);
    }
  };
  return (
    <DriverPage title="An toàn chuyến đi">
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Hỗ trợ khẩn cấp tại Việt Nam</Text>
        <Text>Nếu đang gặp tình huống nguy cấp, liên hệ tổng đài khẩn cấp quốc gia và cho biết vị trí của bạn.</Text>
        <Button label={`Mở điện thoại · ${emergencyNumber}`} icon="call" iconPosition="leading"
          dimWhenDisabled={false} style={{ backgroundColor: colors.error }} contentColor={colors.onError}
          onPress={() => void openPhone()} />
        {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
      </Card>
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
});
