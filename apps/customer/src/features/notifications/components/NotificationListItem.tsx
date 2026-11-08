import {
  getLocale,
  getNotificationText,
  translate as i18nT,
  type CustomerNotification,
} from "@datxe/shared";
import {
  MotionPressable as Pressable,
  Typography as Text,
  useTranslation,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { styles as createStyles, category } from "./NotificationScreenParts";

export function NotificationListItem({
  item,
  onPress,
}: {
  item: CustomerNotification;
  onPress: () => void;
}) {
  const t = useTranslation();
  const text = getNotificationText(item.type, item.payload, t);
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const unread = !item.readAt;
  return (
    <Pressable accessibilityRole="button" accessibilityHint={unread ? i18nT("Chưa đọc") : undefined} onPress={onPress} style={styles.item}>
      <View style={[styles.icon, unread && styles.iconUnread]}>
        <MaterialIcons
          name={
            category(item.type) === "vehicle"
              ? "directions-car"
              : category(item.type) === "promo"
                ? "local-offer"
                : "notifications"
          }
          size={22}
          color={unread ? colors.primary : colors.onSurfaceVariant}
        />
      </View>
      <View style={styles.copy}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{text.title}</Text>
          {unread ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.body}>{text.description}</Text>
        <Text style={styles.time}>
          {i18nT(new Date(item.createdAt).toLocaleString(getLocale()))}
        </Text>
      </View>
    </Pressable>
  );
}
