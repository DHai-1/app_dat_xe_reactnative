import { validateEnv } from "@/config/env";
import "@/lib/auth";
import "@/lib/logger";
import { queryClient } from "@/lib/queryClient";
import { SettingsProvider } from "@/lib/settings/SettingsProvider";
import { useLanguage, useScreenMotion, useTheme, usePushForegroundLaunch } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { usePathname, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import { PushBridge } from "./PushBridge";

export default function RootLayout() {
  useLanguage();

  validateEnv();
  const [loaded, error] = useFonts(MaterialIcons.font);
  const foregroundLaunch = usePushForegroundLaunch();
  if (!foregroundLaunch || (!loaded && !error)) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <PushBridge />
      <SettingsProvider>
        <ThemedStack />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

const HOME_PATHS = new Set(["/", "/home", "/(tabs)/home"]);

/**
 * Nút back cứng của Android:
 * - Có lịch sử  -> pop màn hiện tại.
 * - Hết lịch sử -> về Trang chủ thay vì thoát app.
 * - Đang ở Trang chủ -> trả false để Android thoát app như bình thường.
 */
function useHardwareBack() {
  const router = useRouter();
  const pathname = usePathname();
  const latest = useRef({ router, pathname });
  useEffect(() => {
    latest.current = { router, pathname };
  }, [pathname, router]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const { router: current, pathname: path } = latest.current;
        if (current.canGoBack()) {
          current.back();
          return true;
        }
        if (!HOME_PATHS.has(path)) {
          current.replace("/(tabs)/home");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, []);
}

function ThemedStack() {
  useLanguage();
  useHardwareBack();
  const screenOptions = useScreenMotion();
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions} />
    </>
  );
}
