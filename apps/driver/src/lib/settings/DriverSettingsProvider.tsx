import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppThemeProvider, type ThemeMode } from "@datxe/ui";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const storageKey = "datxe.driver.appearance";
const Settings = createContext<{ mode: ThemeMode; saveMode: (mode: ThemeMode) => Promise<void> }>({
  mode: "system",
  saveMode: async () => {},
});

export function DriverSettingsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(storageKey).then((stored) => {
      if (mounted && (stored === "light" || stored === "dark" || stored === "system")) setMode(stored);
    }).catch(() => {}).finally(() => { if (mounted) setLoaded(true); });
    return () => { mounted = false; };
  }, []);
  const saveMode = async (next: ThemeMode) => {
    await AsyncStorage.setItem(storageKey, next);
    setMode(next);
  };
  if (!loaded) return null;
  return (
    <Settings.Provider value={{ mode, saveMode }}>
      <AppThemeProvider brand="driver" mode={mode}>{children}</AppThemeProvider>
    </Settings.Provider>
  );
}

export const useDriverSettings = () => useContext(Settings);
