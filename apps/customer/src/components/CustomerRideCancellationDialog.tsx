import type { useCustomerRideCancellation } from "@/lib/useCustomerRideCancellation";
import { translate as i18nT } from "@datxe/shared";
import { Button, PaperTextInput, Typography, useThemeColors } from "@datxe/ui";
import { ScrollView, StyleSheet } from "react-native";
import { Dialog, Portal } from "react-native-paper";

export function CustomerRideCancellationDialog({
  cancellation,
  searching = false,
}: {
  cancellation: ReturnType<typeof useCustomerRideCancellation>;
  searching?: boolean;
}) {
  const colors = useThemeColors();
  const { visible, busy, canCancel, canSubmit, error, reason, setReason, dismiss, submit } = cancellation;
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={dismiss} dismissable={!busy} dismissableBackButton={!busy}
        style={{ borderRadius: 28, backgroundColor: colors.surfaceContainerHigh }}>
        <Dialog.Title>{i18nT("Hủy chuyến")}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <PaperTextInput
              label={i18nT("Lý do hủy")}
              mode="flat"
              multiline
              draftValue={reason}
              onChangeText={setReason}
              maxLength={255}
              editable={canCancel && !busy}
              underlineColor={colors.transparent}
            />
            <Typography style={[styles.counter, { color: colors.onSurfaceVariant }]}>{reason.length}/255</Typography>
            {error || !canCancel ? (
              <Typography accessibilityRole="alert" style={{ color: colors.error }}>
                {error || i18nT("Chuyến đã đổi trạng thái và không thể hủy.")}
              </Typography>
            ) : null}
            <Button
              label="Xác nhận hủy chuyến"
              disabled={!canSubmit}
              loading={busy}
              style={{ backgroundColor: !canSubmit || busy ? colors.disabled : colors.error }}
              contentColor={!canSubmit || busy ? colors.disabledText : colors.onError}
              onPress={submit}
            />
            <Button variant="ghost" label={searching ? "Tiếp tục tìm" : "Giữ chuyến"} disabled={busy} onPress={dismiss} />
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: { paddingHorizontal: 0, borderTopWidth: 0, borderBottomWidth: 0 },
  content: { gap: 12, paddingHorizontal: 24 },
  counter: { textAlign: "right" },
});
