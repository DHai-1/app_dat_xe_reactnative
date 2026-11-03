import { useThemeColors, useThemedStyles } from "@datxe/ui";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { styles } from "../components/SessionGateScreenParts";
import { useSessionGate } from "../hooks/useSessionGate";
export default function Index() {
  const colors = useThemeColors();
  const themed_styles = useThemedStyles(styles);

  const { destination } = useSessionGate();
  if (destination) return <Redirect href={destination as never} />;
  return (
    <View style={themed_styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
