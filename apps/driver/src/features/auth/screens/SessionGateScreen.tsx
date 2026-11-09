import { ActivityIndicator } from "react-native-paper";
import { Button, Card, ScreenWrapper, Typography, useThemeColors, useThemedStyles } from "@datxe/ui";
import { Redirect, useRouter } from "expo-router";
import { Image, View } from "react-native";
import { styles } from "../components/SessionGateScreenParts";
import { useSessionGate } from "../hooks/useSessionGate";

export default function Index() {
  const colors = useThemeColors();
  const s = useThemedStyles(styles);
  const router = useRouter();
  const { destination, error, waiting, retry } = useSessionGate();
  if (destination) return <Redirect href={destination as never} />;
  return (
    <ScreenWrapper>
      <View style={s.loading}>
        <Card style={s.card}>
          <Image source={require("../../../../assets/images/brand-logo.png")}
            accessibilityLabel="PtitGo Tài Xế" accessibilityIgnoresInvertColors
            resizeMode="contain" style={s.logo} />
          {!error ? <ActivityIndicator accessibilityLabel="Đang khôi phục phiên" color={colors.primary} /> : null}
          <Typography style={s.status} accessibilityRole={error ? "alert" : undefined}>
            {error || (waiting ? "Đang kết nối. Việc khôi phục phiên mất nhiều thời gian hơn dự kiến." : "Đang khôi phục phiên đăng nhập…")}
          </Typography>
          {error ? <Button label="Thử lại" onPress={retry} /> : null}
          {waiting || error ? <Button variant="ghost" label="Về màn đăng nhập"
            onPress={() => router.replace("/(auth)/login")} /> : null}
        </Card>
      </View>
    </ScreenWrapper>
  );
}
