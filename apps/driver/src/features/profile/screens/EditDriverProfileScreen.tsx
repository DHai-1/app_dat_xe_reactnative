import { DriverPage } from "@/components/DriverPage";
import { request } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import { AUTH_FULL_NAME_MAX_LENGTH, getAuthFullNameValidationError, type AuthProfile } from "@datxe/shared";
import { Button, Card, PaperTextInput as TextInput, SectionHeading, Typography, useThemeColors } from "@datxe/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { driverApi } from "@/lib/driverApi";

import { updateDriverIdentity } from "../api";

export default function EditDriverProfileScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const session = useQuery({ queryKey: ["driver", "session"], queryFn: () => request<AuthProfile>("/auth/me") });
  const bank = useQuery({ queryKey: ["driver", "profile"], queryFn: driverApi.profile });
  const profile = session.data;
  // Keep editor text in a ref. Only publish validation and button state to React.
  const draft = useRef<{ id: number; fullName: string; email: string; bankName: string; bankAccountNumber: string } | null>(null);
  const [validation, setValidation] = useState<{
    id: number;
    nameError: string | null;
    emailError: boolean;
    bankError: string | null;
    changed: boolean;
  } | null>(null);
  const initialName = profile?.fullName ?? "";
  const initialEmail = profile?.email ?? "";
  const initialBankName = bank.data?.bank_name ?? "";
  const initialBankAccount = bank.data?.bank_account_number ?? "";
  const currentValidation = validation && validation.id === profile?.id ? validation : null;
  const updateDraft = (patch: Partial<{ fullName: string; email: string; bankName: string; bankAccountNumber: string }>) => {
    if (!profile) return;
    const previous = draft.current?.id === profile.id ? draft.current : { id: profile.id, fullName: initialName, email: initialEmail, bankName: initialBankName, bankAccountNumber: initialBankAccount };
    const next = { ...previous, ...patch };
    draft.current = next;
    const email = next.email.trim();
    setValidation({
      id: profile.id,
      nameError: getAuthFullNameValidationError(next.fullName),
      emailError: email.length > 255 || Boolean(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      bankError: Boolean(next.bankName.trim()) !== Boolean(next.bankAccountNumber.trim()) ? "Vui lòng nhập đủ tên ngân hàng và số tài khoản." : null,
      changed: next.fullName.trim() !== initialName || email !== initialEmail || next.bankName.trim() !== initialBankName || next.bankAccountNumber.trim() !== initialBankAccount,
    });
  };
  const save = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; fullName: string; email: string | null; bankName: string; bankAccountNumber: string }) => {
      if (useSessionStore.getState().user?.id !== id) throw new Error("Phiên đăng nhập đã thay đổi.");
      const result = await updateDriverIdentity(body);
      if (!result) throw new Error("Chưa nhận được thông tin hồ sơ đã lưu.");
      return result;
    },
    onSuccess: (identity, { id }) => {
      const user = useSessionStore.getState().user;
      if (user?.id !== id) return;
      const updated = { ...user, fullName: identity.fullName, email: identity.email ?? null };
      useSessionStore.getState().setUser(updated);
      client.setQueryData(["driver", "session"], updated);
      void client.invalidateQueries({ queryKey: ["driver"] });
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/profile");
    },
  });
  return (
    <DriverPage title="Thông tin cá nhân" loading={session.isLoading || bank.isLoading} error={session.error?.message || bank.error?.message || save.error?.message} retry={session.error || bank.error ? () => Promise.all([session.refetch(), bank.refetch()]) : undefined}>
      {profile && bank.data && !bank.isError ? (
        <>
          <SectionHeading title="Thông tin liên hệ" />
          <Card key={`${profile.id}:${initialBankName}:${initialBankAccount}`} style={styles.form}>
            <TextInput label="Họ và tên" mode="flat" underlineColor={colors.transparent} defaultValue={initialName}
              maxLength={AUTH_FULL_NAME_MAX_LENGTH} editable={!save.isPending} error={Boolean(currentValidation?.nameError)}
              onChangeText={(fullName) => updateDraft({ fullName })} />
            {currentValidation?.nameError ? <Typography style={{ color: colors.error }}>{currentValidation.nameError}</Typography> : null}
            <TextInput label="Email liên hệ" mode="flat" underlineColor={colors.transparent} defaultValue={initialEmail}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={255}
              editable={!save.isPending} error={Boolean(currentValidation?.emailError)} onChangeText={(value) => updateDraft({ email: value })} />
            {currentValidation?.emailError ? <Typography style={{ color: colors.error }}>Email không hợp lệ.</Typography> : null}
            <Typography style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Số điện thoại đã xác minh</Typography>
            <Typography>{profile.phoneNumber ?? "Chưa có số điện thoại"}</Typography>
          </Card>
          <SectionHeading title="Tài khoản nhận tiền" />
          <Card key={`bank:${profile.id}:${initialBankName}:${initialBankAccount}`} style={styles.form}>
            <Typography style={{ color: colors.onSurfaceVariant }}>Dùng để nhận tiền khi yêu cầu rút tiền được duyệt. Nhập tài khoản ngân hàng chính chủ.</Typography>
            <TextInput label="Tên ngân hàng" mode="flat" underlineColor={colors.transparent} defaultValue={initialBankName}
              maxLength={255} autoCorrect={false} editable={!save.isPending} onChangeText={bankName => updateDraft({ bankName })} />
            <TextInput label="Số tài khoản" mode="flat" underlineColor={colors.transparent} defaultValue={initialBankAccount}
              maxLength={255} keyboardType="number-pad" autoCorrect={false} autoCapitalize="none" editable={!save.isPending}
              onChangeText={bankAccountNumber => updateDraft({ bankAccountNumber })} />
            {currentValidation?.bankError ? <Typography accessibilityRole="alert" style={{ color: colors.error }}>{currentValidation.bankError}</Typography> : null}
          </Card>
          <Button label="Lưu thông tin" loading={save.isPending} disabled={!currentValidation?.changed || Boolean(currentValidation.nameError) || currentValidation.emailError || Boolean(currentValidation.bankError)}
            onPress={() => {
              const current = draft.current;
              if (current?.id === profile.id) {
                save.mutate({ id: profile.id, fullName: current.fullName.trim(), email: current.email.trim() || null, bankName: current.bankName.trim(), bankAccountNumber: current.bankAccountNumber.trim() });
              }
            }} />
        </>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ form: { gap: 12 } });
