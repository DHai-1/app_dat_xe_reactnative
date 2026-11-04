import { Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
KeyboardAvoidingView,
Pressable,
Platform,
  ScrollView,
  Image,
Text,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialButton,styles } from '../components/LoginScreenParts';
import { useLogin } from '../hooks/useLogin';
export default function DriverLoginScreen() {
const { phone, setPhone, busy, error, setError, continueWithPhone, continueWithSocial } = useLogin();
return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('@/assets/images/brand-logo.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandName}>PtitGo</Text>
          <Text style={styles.title}>Chào mừng đối tác</Text>
          <Text style={styles.subtitle}>Đăng nhập để nhận chuyến và bắt đầu hành trình.</Text>

          <Card style={styles.formCard}>
            <Input
              accessibilityLabel="Số điện thoại"
              autoComplete="tel"
              editable={busy === null}
              icon="call"
              keyboardType="phone-pad"
              label="Số điện thoại"
              maxLength={16}
              onChangeText={(value) => {
                setPhone(value);
                setError('');
              }}
              placeholder="0912 345 678"
              value={phone}
            />
            <Text style={styles.helperText}>Xác thực bằng mã OTP gửi qua SMS.</Text>
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={busy !== null && busy !== 'phone'}
              onPress={continueWithPhone}
              style={[styles.phoneButton, busy !== null && busy !== 'phone' && { opacity: 0.5 }]}
            >
              <Text style={styles.phoneButtonText}>{busy === 'phone' ? 'Đang gửi mã OTP...' : 'Xác nhận số điện thoại'}</Text>
              {busy !== 'phone' ? <MaterialIcons color={colors.onPrimary} name="arrow-forward" size={fontSize.iconLg} /> : null}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Google"
              loading={busy === 'google'}
              mark="G"
              onPress={() => void continueWithSocial('google')}
            />
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Facebook"
              loading={busy === 'facebook'}
              mark="f"
              onPress={() => void continueWithSocial('facebook')}
            />
          </Card>

          <View style={styles.footer}>
            <MaterialIcons color={colors.outline} name="verified-user" size={fontSize.iconSm} />
            <Text style={styles.footerText}>Bảo mật tài khoản bằng Firebase Authentication.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
