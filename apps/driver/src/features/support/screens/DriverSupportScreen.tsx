import { DriverPage } from "@/components/DriverPage";
import { useSupportRequests } from "@/lib/useSupportRequests";
import { pickSupportImage } from "@/lib/supportImages";
import { SupportCenter } from "@datxe/ui";
import { resolveDriverNotification } from "@/lib/notificationDestination";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

export default function DriverSupportScreen() {
  const router = useRouter();
  const support = useSupportRequests();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  return (
    <DriverPage
      title="Trợ giúp"
      loading={support.loading}
      error={support.error}
      retry={support.retry}
    >
      <SupportCenter
        {...support}
        initialRideId={Number(rideId) || undefined}
        pickImage={pickSupportImage}
        onOpenSafety={() => router.push("/safety")}
        onOpenTickets={() => router.push("/tickets")}
        onOpenRide={async (id) => {
          const destination = await resolveDriverNotification({ type: "RIDE_UPDATED", payload: { rideId: id } });
          router.push(destination as Href);
        }}
        onRefresh={() => void support.retry()}
      />
    </DriverPage>
  );
}
