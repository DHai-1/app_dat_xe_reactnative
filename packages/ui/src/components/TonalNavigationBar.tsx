import { MaterialIcons } from "@expo/vector-icons";
import { translate } from "@datxe/shared";
import { StyleSheet, View } from "react-native";
import { Badge, Text, TouchableRipple } from "react-native-paper";
import { useThemeColors } from "../theme/ThemeProvider";

export type NavigationItem = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  outlineIcon?: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
};

/** MD3 navigation indicators use tone and shape, with a 48dp touch target. */
export function TonalNavigationBar({
  items,
  active,
  onSelect,
}: {
  items: readonly NavigationItem[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: colors.cardSurface }]}
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <TouchableRipple
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={translate(item.label)}
            onPress={() => {
              if (!selected) onSelect(item.id);
            }}
            style={styles.tab}
          >
            <View style={styles.content}>
              <View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: selected
                      ? colors.primaryContainer
                      : colors.transparent,
                  },
                ]}
              >
                <MaterialIcons
                  name={selected ? item.icon : (item.outlineIcon ?? item.icon)}
                  size={24}
                  color={
                    selected
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant
                  }
                />
                {item.badge ? (
                  <Badge size={16} style={styles.badge}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                ) : null}
              </View>
              <Text
                variant="labelMedium"
                numberOfLines={1}
                style={{
                  color: selected ? colors.onSurface : colors.onSurfaceVariant,
                  fontWeight: "500",
                }}
              >
                {translate(item.label)}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    minHeight: 80,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: { flex: 1, minHeight: 48, borderRadius: 999, overflow: "hidden" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  indicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { position: "absolute", top: 0, right: 8, borderRadius: 999 },
});
