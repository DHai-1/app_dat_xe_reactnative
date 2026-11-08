import { Button, Typography, useThemeColors } from "@datxe/ui";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { Dialog, Portal } from "react-native-paper";

export function DriverConfirmationDialog({ title, description, confirmLabel, dismissLabel, visible, busy, disabled, destructive = true, error, onDismiss, onConfirm, children }: {
  title: string;
  description: string;
  confirmLabel: string;
  dismissLabel: string;
  visible: boolean;
  busy: boolean;
  disabled?: boolean;
  destructive?: boolean;
  error?: string;
  onDismiss: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} dismissable={!busy} dismissableBackButton={!busy}
        style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: 28 }}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Typography>{description}</Typography>
          {children}
          {error ? <Typography accessibilityRole="alert" style={{ color: colors.error }}>{error}</Typography> : null}
          <Button label={confirmLabel} onPress={onConfirm} loading={busy} disabled={disabled}
            style={[styles.button, { backgroundColor: disabled || busy ? colors.disabled : destructive ? colors.error : colors.primary }]}
            contentColor={disabled || busy ? colors.disabledText : destructive ? colors.onError : colors.onPrimary} />
          <Button label={dismissLabel} onPress={onDismiss} variant="ghost" disabled={busy} style={styles.button} />
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({ content: { gap: 12 }, button: { height: 48 } });
