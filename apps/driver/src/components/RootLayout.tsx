import { validateEnv } from "@/config/env";
import "@/lib/auth";
import "@/lib/logger";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider, useScreenMotion, useTheme, usePushForegroundLaunch } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DriverRealtimeBridge } from "./DriverRealtimeBridge";
import { PushBridge } from "./PushBridge";

export default function RootLayout() {
  validateEnv();
  const [loaded, error] = useFonts(MaterialIcons.font);
  const foregroundLaunch = usePushForegroundLaunch();
  if (!foregroundLaunch || (!loaded && !error)) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider brand="driver" mode="system">
        <PushBridge />
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
