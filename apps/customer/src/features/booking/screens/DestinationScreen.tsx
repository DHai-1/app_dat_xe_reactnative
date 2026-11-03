import { useLanguage } from "@datxe/ui";
import PlaceSelectionScreen from "./PlaceSelectionScreen";
export default function DestinationScreen() {
  useLanguage();
  return <PlaceSelectionScreen kind="dropoff" />;
}
