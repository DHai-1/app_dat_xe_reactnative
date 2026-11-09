import { rideStyles } from "@/components/rideStyles";
import { formatMoney, type CustomerRideDetail } from "@datxe/shared";
import { Typography as Text, useThemedStyles } from "@datxe/ui";

export function RideEarnings({ earnings }: { earnings: CustomerRideDetail['driverEarnings'] }) {
  const s = useThemedStyles(rideStyles);
  return <>
    <Text style={s.label}>Thu nhập sau chiết khấu</Text>
    {earnings ? <>
      <Text style={s.amount}>{formatMoney(earnings.netAmount)}</Text>
      <Text style={s.text}>Chiết khấu: {formatMoney(earnings.commissionAmount)}</Text>
      <Text style={s.label}>{earnings.creditedToCash ? 'Đã cộng vào ví tiền mặt.' : earnings.paid ? 'Tiền khách đã trả trực tiếp; chiết khấu đã trừ từ ví tín dụng.' : 'Chờ thu tiền khách. Chiết khấu đã trừ từ ví tín dụng.'}</Text>
    </> : <Text style={s.text}>Chưa có dữ liệu quyết toán cho chuyến này.</Text>}
  </>;
}
