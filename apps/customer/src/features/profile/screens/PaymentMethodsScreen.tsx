import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  localizedAlert,
  Card,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { accountStyles } from "../components/AccountScreenStyles";
import { useProfileEditor } from "../hooks/useProfileEditor";
export default function PaymentMethodsScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const c = useThemeColors(),
    s = accountStyles(c),
    router = useRouter();
  const { query, save } = useProfileEditor();
  const selected = query.data?.default_payment_method === "CASH";
  const confirm = async () => {
    if (save.isPending) return;
    try {
      await save.mutateAsync("CASH");
      localizedAlert(
        i18nT("Đã cập nhật"),
        i18nT("Tiền mặt là phương thức thanh toán mặc định."),
      );
    } catch {}
  };
  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader
        title={i18nT("Phương thức thanh toán")}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.intro}>
          {i18nT("Chọn cách thanh toán cho những chuyến đi của bạn.")}
        </Text>
        <Text style={s.section}>{i18nT("Phương thức khả dụng")}</Text>
        <Card style={s.card}>
          <View style={s.row}>
            <View style={s.icon}>
              <MaterialIcons name="payments" size={26} color={c.primary} />
            </View>
            <View style={extra.item1}>
              <Text style={s.title}>{i18nT("Tiền mặt")}</Text>
              <Text style={s.intro}>
                {i18nT(
                  selected
                    ? "Đang dùng mặc định"
                    : "Thanh toán trực tiếp cho tài xế",
                )}
              </Text>
            </View>
            <MaterialIcons
              name={
                selected ? "check-circle" : "payments"
              }
              size={24}
              color={selected ? c.successStrong : c.onSurfaceVariant}
            />
          </View>
          <Text style={s.intro}>
            {i18nT(
              "Thanh toán cho tài xế khi kết thúc chuyến đi, theo số tiền hiển thị trong ứng dụng.",
            )}
          </Text>
        </Card>
        {query.isLoading ? <ActivityIndicator color={c.primary} /> : null}
        {query.error ? (
          <>
            <Text style={s.error}>{i18nT(query.error.message)}</Text>
            <Button
              label={i18nT("Thử lại")}
              onPress={() => void query.refetch()}
            />
          </>
        ) : null}
        {save.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {i18nT(save.error.message)}
          </Text>
        ) : null}
      </ScrollView>
      {query.data && !selected ? <View style={s.footer}>
        <Button
          label={i18nT(
            selected ? "Đã chọn tiền mặt" : "Dùng tiền mặt mặc định",
          )}
          disabled={selected || !query.data}
          loading={save.isPending}
          onPress={() => void confirm()}
        />
      </View> : null}
    </SafeAreaView>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { flex: 1, gap: 8 },
  });
