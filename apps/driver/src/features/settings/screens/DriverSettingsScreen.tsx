import { DriverPage } from "@/components/DriverPage";
import { GroupedList, SettingsListItem, type ThemeMode } from "@datxe/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking } from "react-native";
import { RadioButton } from "react-native-paper";
import { useDriverSettings } from "@/lib/settings/DriverSettingsProvider";

const appearances: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Theo hệ thống" },
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
];

export default function DriverSettingsScreen() {
  const router = useRouter();
  const { mode, saveMode } = useDriverSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectMode = async (value: ThemeMode) => {
    setSaving(true);
    setError("");
    try { await saveMode(value); }
    catch { setError("Chưa lưu được giao diện. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };
  return (
    <DriverPage title="Cài đặt" error={error}>
      <GroupedList title="Giao diện">
        {appearances.map(({ value, label }) => (
          <RadioButton.Item key={value} value={value} label={label}
            status={mode === value ? "checked" : "unchecked"} disabled={saving}
            onPress={() => void selectMode(value)} />
        ))}
      </GroupedList>
      <GroupedList title="Quyền và kết nối">
        <SettingsListItem title="Tình trạng nhận chuyến" icon="gps-fixed" description="Kiểm tra kết nối, GPS và vị trí nền" onPress={() => router.push("/settings/reception")} />
        <SettingsListItem title="Quyền ứng dụng" icon="settings" description="Vị trí và thông báo trong cài đặt thiết bị" onPress={() => {
          setError("");
          void Linking.openSettings().catch(() => setError("Chưa mở được cài đặt thiết bị."));
        }} />
      </GroupedList>
      <GroupedList title="Thông tin ứng dụng">
        <SettingsListItem title="Quyền riêng tư trên ứng dụng" icon="privacy-tip"
          onPress={() => router.push("/settings/privacy")} />
      </GroupedList>
    </DriverPage>
  );
}
