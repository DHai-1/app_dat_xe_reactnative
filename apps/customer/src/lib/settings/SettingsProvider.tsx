import { useSessionStore } from "@/lib/store";
import { getLanguage, setLanguage } from "@datxe/shared";
import { AppThemeProvider as ThemeProvider, type ThemeMode } from "@datxe/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export type SavedPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};
type Data = {
  mode: ThemeMode;
  language: "vi" | "en";
  notifications: Record<string, boolean>;
  places: SavedPlace[];
};
const initial: Data = {
  mode: "light",
  language: "vi",
  notifications: { ride: true, chat: true, promotion: true },
  places: [],
};
const preferenceKey = "customer-ui-preferences-v1";
const Context = createContext({
  data: initial,
  update: (_patch: Partial<Data>) => {},
  clear: async () => {},
  ready: false,
});
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initial);
  const uid = useSessionStore((state) => state.user?.firebaseUid ?? "guest");
  const storageKey = "customer-settings-v1:" + uid;
  const [loadedKey, setLoadedKey] = useState("");
  useEffect(() => {
    let alive = true;
    void Promise.all([
      AsyncStorage.getItem(storageKey),
      AsyncStorage.getItem(preferenceKey),
    ])
      .then(([raw, preferences]) => {
        if (!alive) return;
        const parsed = raw ? JSON.parse(raw) : {};
        const local = preferences ? JSON.parse(preferences) : parsed;
        const language = local.language === "en" ? "en" : "vi";
        const mode: ThemeMode = ["light", "dark", "system"].includes(local.mode)
          ? local.mode
          : "light";
        setLanguage(language);
        setData({
          ...initial,
          mode,
          language,
          notifications: { ...initial.notifications, ...parsed.notifications },
          places: Array.isArray(parsed.places) ? parsed.places : [],
        });
        // Migrate existing account preferences to device preferences, including the login screen.
        if (!preferences)
          void AsyncStorage.setItem(
            preferenceKey,
            JSON.stringify({ mode, language }),
          ).catch(() => {});
      })
      .catch(() => {
        if (alive) setData({ ...initial, language: getLanguage() });
      })
      .finally(() => {
        if (alive) setLoadedKey(storageKey);
      });
    return () => {
      alive = false;
    };
  }, [storageKey]);
  const update = (patch: Partial<Data>) => {
    const next = { ...data, ...patch };
    if (patch.language) setLanguage(patch.language);
    setData(next);
    void AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
    if (patch.language || patch.mode)
      void AsyncStorage.setItem(
        preferenceKey,
        JSON.stringify({ mode: next.mode, language: next.language }),
      ).catch(() => {});
  };
  const clear = async () => {
    await AsyncStorage.removeItem(storageKey);
    setData((previous) => ({
      ...initial,
      mode: previous.mode,
      language: previous.language,
    }));
  };
  const ready = loadedKey === storageKey;
  return (
    <Context.Provider value={{ data, update, clear, ready }}>
      <ThemeProvider mode={data.mode}>{ready ? children : null}</ThemeProvider>
    </Context.Provider>
  );
}
export const useSettings = () => useContext(Context);
