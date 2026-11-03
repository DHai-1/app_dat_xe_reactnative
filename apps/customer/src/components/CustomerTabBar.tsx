import { translate as i18nT } from "@datxe/shared";
import {
  borderRadius,
  MotionPressable as Pressable,
  shadowStyle,
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

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

  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={i18nT(tab.label)}
            onPress={() => {
              if (!selected) router.replace(tab.route);
            }}
            style={styles.item}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons
                name={selected ? tab.icon : tab.outlineIcon}
                size={24}
                color={selected ? colors.primary : colors.onSurfaceVariant}
              />
              {tab.id === "notifications" && unreadCount > 0 ? (
                <View style={styles.dot} />
              ) : null}
            </View>
            <Text
              style={[styles.label, selected && styles.labelActive]}
              numberOfLines={1}
            >
              {i18nT(tab.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    bar: {
      width: "100%",
      alignSelf: "stretch",
      height: spacing.tabBarHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: spacing.spaceXs,
      backgroundColor: colors.surfaceContainerLowest,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
      ...shadowStyle,
    },
    item: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.gap1_5,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    label: { ...typography.labelSm, color: colors.onSurfaceVariant },
    labelActive: { color: colors.primary, fontWeight: "600" },
    dot: {
      position: "absolute",
      top: -2,
      right: -3,
      width: spacing.badgeSm,
      height: spacing.badgeSm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surfaceContainerLowest,
    },
  });
