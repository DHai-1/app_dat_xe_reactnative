import { DriverPage } from '@/components/DriverPage';
import { useSupportRequests } from '@/lib/useSupportRequests';
import { pickSupportImage } from '@/lib/supportImages';
import { SupportCenter, Button } from '@datxe/ui';
import { useLocalSearchParams } from 'expo-router';

export default function DriverSupportScreen() {
  const support = useSupportRequests();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  return <DriverPage title="Trợ giúp" loading={support.loading} error={support.error} retry={support.retry}>
    <Button label="Tải lại phản hồi" variant="secondary" onPress={() => void support.retry()} />
    <SupportCenter {...support} initialRideId={Number(rideId) || undefined} pickImage={pickSupportImage} />
  </DriverPage>;
}
