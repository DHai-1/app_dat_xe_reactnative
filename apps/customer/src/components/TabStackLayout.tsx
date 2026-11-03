import { useLanguage, useScreenMotion } from "@datxe/ui";
import { Stack } from "expo-router";
export default function TabStackLayout() {
  useLanguage();

  const options = useScreenMotion(true);
  return <Stack screenOptions={options} />;
}
