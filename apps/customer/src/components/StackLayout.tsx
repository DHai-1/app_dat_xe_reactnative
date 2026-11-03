import { useLanguage, useScreenMotion } from "@datxe/ui";
import { Stack } from "expo-router";
export default function StackLayout() {
  useLanguage();

  const screenOptions = useScreenMotion();
  return <Stack screenOptions={screenOptions} />;
}
