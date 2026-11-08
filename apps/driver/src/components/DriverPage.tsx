import type { ReactNode } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { colors, useThemedStyles } from '@datxe/ui';
import { rideStyles } from './rideStyles';
import { DriverTabBar } from './DriverTabBar';
import { ScreenHeader } from './ScreenHeader';

type DriverPageProps = { title: string; children: ReactNode; loading?: boolean; error?: string | null; retry?: () => unknown; tabs?: boolean; footer?: ReactNode; dark?: boolean };

export function DriverPage({ title, children, loading, error, retry, tabs: showTabs = false, footer, dark = false }: DriverPageProps) {
  const styles = useThemedStyles(rideStyles);
  const router = useRouter();
  const pathname = usePathname();
  const active = (pathname.split('/').pop() as 'home' | 'history' | 'notifications' | 'profile') || 'home';
  return <SafeAreaView style={[styles.safe, dark && { backgroundColor: '#000000' }]}>
    <Image
      accessibilityIgnoresInvertColors
      pointerEvents="none"
      source={require('@/assets/images/brand-mark.png')}
      style={[styles.watermark, dark && { opacity: 0 }]}
    />
    <ScreenHeader title={title} onBack={showTabs ? undefined : () => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} />
    <ScrollView contentContainerStyle={[styles.page, dark && { backgroundColor: '#000000' }]}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>{retry ? <Text onPress={() => void retry()} style={styles.link}>Thử lại</Text> : null}</View> : null}
      {children}
    </ScrollView>
    {footer ? <View style={styles.footer}>{footer}</View> : null}
    {showTabs ? <DriverTabBar active={active} /> : null}
  </SafeAreaView>;
}

export const LegacyDriverPage = DriverPage;
