import { Typography as Text, useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { Redirect } from "expo-router";
import { ActivityIndicator, Image, View } from "react-native";
import { styles as base_styles } from "../components/SessionGateScreenParts";
import { useSessionGate } from "../hooks/useSessionGate";

/** Logo PtitGo dùng cho splash trong app (asset đã bo góc sẵn). */
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
      <Text style={styles.tagline}>FAST • SAFE • RELIABLE</Text>
      <View style={styles.footer}>
        <ActivityIndicator color={colors.onPrimaryContainer} size="small" />
      </View>
    </View>
  );
}
