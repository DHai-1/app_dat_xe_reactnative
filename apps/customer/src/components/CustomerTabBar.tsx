import { TonalNavigationBar, useLanguage } from "@datxe/ui";
import { useRouter } from "expo-router";

const tabs = [
  {
    id: "home",
    label: "Trang chủ",
    icon: "home-filled" as const,
    outlineIcon: "home" as const,
    route: "/(tabs)/home" as const,
  },
  {
    id: "history",
    label: "Lịch sử",
    icon: "receipt-long" as const,
    outlineIcon: "receipt-long" as const,
    route: "/(tabs)/history" as const,
  },
  {
    id: "notifications",
    label: "Thông báo",
    icon: "notifications" as const,
    outlineIcon: "notifications-none" as const,
    route: "/(tabs)/notifications" as const,
  },
  {
    id: "profile",
    label: "Hồ sơ",
    icon: "person" as const,
    outlineIcon: "person-outline" as const,
    route: "/(tabs)/profile" as const,
  },
];

export type CustomerTab = (typeof tabs)[number]["id"];

export function CustomerTabBar({
  active,
  unreadCount = 0,
}: {
  active: CustomerTab;
  unreadCount?: number;
}) {
  useLanguage();
  const router = useRouter();
  return (
    <TonalNavigationBar
      active={active}
      items={tabs.map((tab) => ({
        ...tab,
        badge: tab.id === "notifications" ? unreadCount : undefined,
      }))}
      onSelect={(id) => {
        const tab = tabs.find((item) => item.id === id);
        if (tab) router.replace(tab.route);
      }}
    />
  );
}
