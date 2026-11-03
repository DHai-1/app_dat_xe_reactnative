import { useLanguage } from "@datxe/ui";
import PlaceSelectionScreen from "./PlaceSelectionScreen";
export default function PickupScreen() {
  useLanguage();
  return <PlaceSelectionScreen kind="pickup" />;
}
