import { translate as t } from "@datxe/shared";
import { ActivityIndicator } from "react-native-paper";
import { Typography as Text, useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { Redirect } from "expo-router";
import { Image, View } from "react-native";
import { styles as base_styles } from "../components/SessionGateScreenParts";
import { useSessionGate } from "../hooks/useSessionGate";

/** Customer artwork supplied with the new PtitGo identity. */
const brandLogo = require("../../../../assets/images/brand-logo.png");

export default function Index() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const { destination } = useSessionGate();
  if (destination) return <Redirect href={destination as never} />;
  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="PtitGo"
        resizeMode="contain"
        source={brandLogo}
        style={styles.logo}
      />
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text accessibilityLiveRegion="polite" style={styles.tagline}>{t("Khôi phục phiên đăng nhập")}</Text>
      </View>
    </View>
  );
}
