import { confirmPhoneCode, normalizeVietnamPhoneNumber, sendPhoneCode } from '@datxe/shared';
import { AuthBackButton, AuthHero, Card, OtpCodeInput, ResendOtpButton, colors, spacing, typography } from '@datxe/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../components/RegisterScreenParts';

export default function DriverRegisterOtpScreen() {
  const { phone: rawPhone } = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const phone = typeof rawPhone === 'string' ? rawPhone : '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!phone) return null;
  const verify = async () => {
    if (code.length !== 6) { setError('Vui lòng nhập đủ 6 chữ số OTP.'); return; }
    setLoading(true); setError('');
    try { await confirmPhoneCode(code); router.replace({ pathname: '/(auth)/register', params: { phone: normalizeVietnamPhoneNumber(phone) } } as never); }
    catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  };
  const resend = async () => { setLoading(true); setError(''); try { await sendPhoneCode(phone, { linkToCurrentAccount: true }); setCode(''); return true; } catch (cause) { setError(getErrorMessage(cause)); return false; } finally { setLoading(false); } };
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}><View style={s.top}><AuthBackButton onPress={() => router.replace('/(auth)/register' as never)} /></View><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><AuthHero detail={normalizeVietnamPhoneNumber(phone)} icon="sms" subtitle="Nhập mã xác thực 6 chữ số vừa được gửi qua SMS." title="Xác thực số điện thoại" /><Card style={s.card}><Text style={s.label}>Mã OTP</Text><OtpCodeInput autoFocus value={code} onChange={value => { setCode(value); setError(''); }} /><Text style={s.helper}>Mã xác thực có hiệu lực trong thời gian ngắn.</Text></Card>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}<Pressable disabled={loading} onPress={() => void verify()} style={[s.confirm, loading && s.disabled]}><Text style={s.confirmText}>{loading ? 'Đang xác minh...' : 'Xác nhận OTP'}</Text>{loading ? <ActivityIndicator color={colors.onPrimary} /> : null}</Pressable><ResendOtpButton disabled={loading} onResend={resend} /><Pressable disabled={loading} onPress={() => router.replace('/(auth)/register' as never)}><Text style={s.change}>Đổi số điện thoại</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, top: { paddingHorizontal: spacing.margin, paddingTop: spacing.spaceXs }, content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.spaceMd, padding: spacing.margin }, card: { width: '100%', padding: spacing.spaceMd, gap: spacing.spaceMd }, label: { ...typography.labelLg, color: colors.onSurface }, helper: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' }, error: { ...typography.bodyMd, color: colors.error, textAlign: 'center' }, confirm: { width: '100%', minHeight: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, confirmText: { ...typography.labelLg, color: colors.onPrimary }, disabled: { opacity: 0.55 }, change: { ...typography.labelMd, color: colors.onSurfaceVariant, padding: 12 } });
