import { useScreenMotion } from "@datxe/ui";
import { Stack } from "expo-router";
export default function StackLayout() {
  const screenOptions = useScreenMotion();
  return <Stack screenOptions={screenOptions} />;
}
