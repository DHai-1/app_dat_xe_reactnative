import { ActivityIndicator } from "react-native-paper";
import { useLanguage, useThemedStyles } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { useBookingStart } from "../hooks/useBookingStart";
export default function BookingStartScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  useBookingStart();
  return (
    <View style={extra.item1}>
      <ActivityIndicator />
    </View>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { flex: 1, justifyContent: "center" },
  });
