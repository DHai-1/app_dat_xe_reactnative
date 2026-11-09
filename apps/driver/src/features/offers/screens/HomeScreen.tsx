import { HomeDriverHeader } from "../components/HomeDriverHeader";
import { HomeOperationalStatus } from "../components/HomeOperationalStatus";
import { DriverPage } from "@/components/DriverPage";
import { DriverChatButton } from "@/components/DriverChatButton";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicleTypeLabel, transmissionLabel } from "@/lib/displayLabels";
import { rideStyles as s } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import type { DriverDocument } from "@datxe/shared";
import {
  Button,
  Card,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useState } from "react";
import { RadioButton } from "react-native-paper";
import { useHome } from "../hooks/useHome";

const today = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};
const isExpired = (value: string | null | undefined) =>
  Boolean(value && value.slice(0, 10) < today());
const formatDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};
const currentLicense = (
  documents: DriverDocument[],
): DriverDocument | undefined =>
  documents.find(
    (document) =>
      document.document_type === "DRIVER_LICENSE" && document.is_current,
  );

export default function DriverHomeScreen() {
  const themed_s = useThemedStyles(s);
  const [vehicle, setVehicle] = useState<"CAR" | "MOTORCYCLE" | null>(null);
  const h = useHome();
  const online = h.session.data?.status === "ONLINE";
  const approved = h.verification.data?.verification_status === "APPROVED";
  const skills = h.skills.data ?? [];
  const verifiedSkills = skills.filter((skill) => skill.verified);
  const vehicleTypes = [...new Set(verifiedSkills.map((skill) => skill.vehicle_type))];
  const selected = vehicle && vehicleTypes.includes(vehicle) ? vehicle : vehicleTypes[0];
  const license = currentLicense(h.documents.data ?? []);
  const licenseExpired = isExpired(license?.expires_at);
  const checking = !h.active.data && (h.availability.isPending || h.session.isLoading || h.active.isLoading
    || h.verification.isLoading || h.skills.isLoading || h.documents.isLoading || h.credit.isFetching);
  const blocker = !h.credit.data || h.credit.isError
    ? { title: "Chưa kiểm tra được số dư ví tín dụng", action: "Kiểm tra lại số dư", onPress: () => void h.credit.refetch() }
    : !h.credit.data.canReceive
      ? { title: "Số dư ví tín dụng không đủ", action: "Nạp tiền", onPress: () => h.router.push("/profile/top-up") }
    : !h.session.data || !h.verification.data || !h.skills.data || !h.documents.data
    || (h.active.isError && h.active.data === undefined)
    ? { title: "Chưa tải được điều kiện nhận chuyến" }
    : !approved
      ? { title: "Hồ sơ chưa đủ điều kiện nhận chuyến", action: "Xem kết quả xét duyệt", onPress: () => h.router.push("/(auth)/approval-status") }
      : licenseExpired
        ? { title: `Giấy phép đã hết hạn · ${formatDate(license?.expires_at ?? "")}`, action: "Cập nhật giấy phép", onPress: () => h.router.push("/(auth)/license-upload") }
        : !verifiedSkills.length
          ? { title: "Chưa có kỹ năng lái xe được duyệt", action: "Kiểm tra hồ sơ", onPress: () => h.router.push(skills.length ? "/(auth)/approval-status" : "/(auth)/license-upload") }
          : undefined;
  return (
    <DriverPage
      title="Trang chủ tài xế"
      tabs
      intro={(
        <>
        <HomeDriverHeader summary={h.summary.data} name={h.session.data?.fullName} loading={h.summary.isLoading} error={h.summary.isError} onRetry={() => void h.summary.refetch()} onProfile={() => h.router.navigate("/(tabs)/profile")} />
        <HomeOperationalStatus online={online} active={Boolean(h.active.data)} loading={checking}
          blocker={blocker} onDiagnostics={() => h.router.push("/settings/reception")}>
          {!h.active.data && h.credit.data && !h.credit.data.canReceive ? (
            <Text style={themed_s.text}>Ví tín dụng: {formatMoney(h.credit.data.creditBalance)} · Hạn mức: {formatMoney(h.credit.data.minimumCredit)}. Cần nạp thêm {formatMoney(h.credit.data.shortfall)} để nhận chuyến.</Text>
          ) : null}
          {!h.active.data && online ? (
            <Button variant="secondary" label="Tạm ngừng nhận chuyến"
              onPress={() => h.availability.mutate({ online: false })} />
          ) : !h.active.data && !blocker ? (
            <>
              <RadioButton.Group value={selected ?? ""} onValueChange={(value) => {
                if (value === "CAR" || value === "MOTORCYCLE") setVehicle(value);
              }}>
                {vehicleTypes.map((type) => (
                  <RadioButton.Item key={type} value={type} label={vehicleTypeLabel(type)} style={{ minHeight: 48 }} />
                ))}
              </RadioButton.Group>
              {verifiedSkills.filter((skill) => skill.vehicle_type === selected).map((skill) => (
                <Text key={skill.id} style={themed_s.label}>
                  {transmissionLabel(skill.transmission)}{skill.license_class ? ` · Hạng ${skill.license_class}` : ""}
                </Text>
              ))}
              <Button label="Bật nhận chuyến" disabled={!selected || !h.credit.allowed}
                onPress={() => { if (selected) h.availability.mutate({ online: true, vehicle_type: selected }); }} />
            </>
          ) : null}
        </HomeOperationalStatus>
        </>
      )}
      loading={h.session.isLoading || h.active.isLoading}
      error={
        h.session.error?.message ||
        h.verification.error?.message ||
        h.active.error?.message ||
        h.offer.error?.message ||
        h.skills.error?.message ||
        h.documents.error?.message ||
        h.availability.error?.message
      }
      retry={() =>
        Promise.all([
          h.session.refetch(),
          h.verification.refetch(),
          h.active.refetch(),
          h.offer.refetch(),
          h.skills.refetch(),
          h.documents.refetch(),
          h.credit.refetch(),
        ])
      }
    >
      {h.credit.allowed && h.offer.data && !h.active.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.title}>
            Yêu cầu chuyến #{h.offer.data.rideId}
          </Text>
          <Text style={themed_s.text}>
            {h.offer.data.pickup.address} → {h.offer.data.dropoff.address}
          </Text>
          <Button
            onPress={() => h.router.push({ pathname: "/ride/accept", params: { rideId: String(h.offer.data?.rideId) } })}
            style={themed_s.button}
            label={"Xem yêu cầu"}
            textStyle={themed_s.buttonText}
          />
        </Card>
      ) : null}

      {h.active.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.text}>
            Chuyến #{h.active.data.id}
          </Text>
          <StatusBadge
            kind="ride"
            value={h.active.data.status}
            contextLabel="Trạng thái chuyến"
          />
          <Text style={themed_s.text}>
            {["IN_PROGRESS", "ARRIVED_DESTINATION", "VEHICLE_RETURNED"].includes(h.active.data.status)
              ? h.active.data.dropoffAddress || "Chưa có địa chỉ điểm trả"
              : h.active.data.pickupAddress || "Chưa có địa chỉ điểm đón"}
          </Text>
          <Button
            style={themed_s.button}
            onPress={() => h.router.push("/ride/in-progress")}
            label={"Tiếp tục chuyến"}
            textStyle={themed_s.buttonText}
          />
          <DriverChatButton ride={h.active.data} />
        </Card>
      ) : null}

    </DriverPage>
  );
}
