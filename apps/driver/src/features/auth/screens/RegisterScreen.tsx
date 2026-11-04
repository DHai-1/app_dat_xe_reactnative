import { AUTH_FULL_NAME_MAX_LENGTH } from '@datxe/shared';
import { Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { Image,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DRIVER_GREEN,styles } from '../components/RegisterScreenParts';
import { useRegister } from '../hooks/useRegister';
export default function DriverRegisterScreen() {
const { user, router, fullName, setFullName, phone, setPhone, code, setCode, codeSent, verifiedPhone, loading, error, setError, sendCode, verifyCode, submit } = useRegister();
if (!user) return null;
return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')} style={styles.backButton}>
        <MaterialIcons color={colors.onSurface} name="arrow-back" size={fontSize.iconXl} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image source={require('@/assets/images/brand-logo.png')} style={styles.brandLogo} resizeMode="contain" />
        <Text style={styles.title}>Đăng ký đối tác tài xế</Text>
        <Text style={styles.subtitle}>Xác minh thông tin để bắt đầu hồ sơ tài xế.</Text>

        <Card style={styles.card}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            icon="person"
            label="Họ và tên theo giấy tờ"
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError('');
            }}
            placeholder="Nguyễn Văn An"
            value={fullName}
          />

          {verifiedPhone ? (
            <View style={styles.verifiedRow}>
              <MaterialIcons color={DRIVER_GREEN} name="verified" size={fontSize.iconMd} />
              <Text style={styles.verifiedText}>Số điện thoại đã xác minh: {verifiedPhone}</Text>
            </View>
          ) : (
            <>
              <Input
                autoComplete="tel"
                editable={!codeSent}
                icon="call"
                keyboardType="phone-pad"
                label="Số điện thoại"
                onChangeText={(value) => {
                  setPhone(value);
                  setError('');
                }}
                placeholder="0912 345 678"
                value={phone}
              />
              {codeSent ? (
                <Input
                  autoComplete="sms-otp"
                  keyboardType="number-pad"
                  label="Mã OTP"
                  maxLength={6}
                  onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 chữ số"
                  value={code}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={codeSent ? verifyCode : sendCode}
                style={[styles.secondaryButton, loading && styles.disabledButton]}
              ><Text style={styles.secondaryButtonText}>{loading ? 'Đang xác minh...' : codeSent ? 'Xác minh số điện thoại' : 'Gửi mã OTP'}</Text></Pressable>
            </>
          )}

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          {verifiedPhone ? <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={submit}
            style={[styles.submitButton, loading && styles.disabledButton]}
          ><Text style={styles.submitButtonText}>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản và tiếp tục'}</Text><MaterialIcons color={colors.onPrimary} name="arrow-forward" size={fontSize.iconLg} /></Pressable> : null}
          <Text style={styles.note}>Sau khi tạo tài khoản, bạn sẽ hoàn tất hồ sơ và tải giấy tờ lái xe lên.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
