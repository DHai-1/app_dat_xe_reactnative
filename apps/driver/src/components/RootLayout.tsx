import { validateEnv } from "@/config/env";
import "@/lib/auth";
import "@/lib/logger";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider, useScreenMotion, useTheme } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DriverRealtimeBridge } from "./DriverRealtimeBridge";

export default function RootLayout() {
  validateEnv();
  const [loaded, error] = useFonts(MaterialIcons.font);
  if (!loaded && !error) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider brand="driver" mode="system">
        <DriverRealtimeBridge />
        <DriverStack />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function DriverStack() {
  const screenOptions = useScreenMotion();
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions} />
    </>
  );
}
