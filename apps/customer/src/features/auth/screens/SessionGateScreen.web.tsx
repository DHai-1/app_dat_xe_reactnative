import { useLanguage } from "@datxe/ui";
import { Redirect } from "expo-router";

export default function WebIndex() {
  useLanguage();

  return <Redirect href="/(auth)/login" />;
}
