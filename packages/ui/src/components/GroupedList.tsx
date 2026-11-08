import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Divider, List } from "react-native-paper";
import { translate } from "@datxe/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, useThemeColors } from "../theme/ThemeProvider";
import { Card } from "./Card";
import { SectionHeading } from "./SectionHeading";

/** Related rows share a single 24dp tonal card with 16dp content insets. */
export function GroupedList({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.group, style]}>
      {title ? <SectionHeading title={title} /> : null}
      <Card>
        {Children.toArray(children).map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

export function SettingsListItem({
  title,
  description,
  icon,
  onPress,
  right,
  disabled,
  destructive,
}: {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  right?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const { colors, brand } = useTheme();
  const tint = destructive ? colors.error : brand === "driver" ? colors.onSurfaceVariant : colors.primary;
  return (
    <List.Item
      title={translate(title)}
      description={description ? translate(description) : undefined}
      titleNumberOfLines={2}
      descriptionNumberOfLines={4}
      titleStyle={[
        styles.rowTitle,
        { color: destructive ? tint : colors.onSurface },
      ]}
      descriptionStyle={{ color: colors.onSurfaceVariant }}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={translate(title)}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}
      left={
        icon
          ? () => (
              <View style={styles.icon}>
                <MaterialIcons name={icon} size={24} color={tint} />
              </View>
            )
          : undefined
      }
      right={
        right
          ? () => <View style={styles.trailing}>{right}</View>
          : onPress
            ? () => (
                <View style={styles.trailing}>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={colors.onSurfaceVariant}
                  />
                </View>
              )
            : undefined
      }
    />
  );
}
const styles = StyleSheet.create({
  group: { gap: 0 },
  divider: { marginVertical: 4 },
  row: {
    borderRadius: 24,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  rowTitle: { fontWeight: "500", fontSize: 16 },
  icon: { justifyContent: "center", paddingHorizontal: 8 },
  trailing: { alignSelf: "center", justifyContent: "center" },
});
