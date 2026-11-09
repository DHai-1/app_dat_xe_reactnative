import { useTickets } from '@/lib/useTickets';
import { ScreenWrapper, TicketList } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

export default function TicketListScreen() {
  const router = useRouter();
  const tickets = useTickets();
  return (
    <ScreenWrapper>
      <Appbar.Header statusBarHeight={0}>
        <Appbar.BackAction accessibilityLabel="Quay lại" onPress={() => router.back()} />
        <Appbar.Content title="Hỗ trợ" />
      </Appbar.Header>
      <TicketList
        tickets={tickets.items}
        loading={tickets.loading}
        refreshing={tickets.refreshing}
        error={tickets.error}
        onRefresh={() => void tickets.refresh()}
        onRetry={() => void tickets.refresh()}
        onOpen={id => router.push({ pathname: '/tickets/[id]', params: { id: String(id) } })}
        onCreate={() => router.push('/tickets/new')}
      />
    </ScreenWrapper>
  );
}
