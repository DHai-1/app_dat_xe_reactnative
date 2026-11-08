import type { CustomerRideDetail } from '@datxe/shared';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Typography as Text } from './components/Typography';

export function HandoverHistory({ revisions }: { revisions: { revision: number; report: CustomerRideDetail['handoverReports'][number]; requestedAt: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!revisions.length) return null;
  return <View style={s.stack}>
    <Button label={open ? 'Ẩn phiên bản cũ' : `Xem ${revisions.length} phiên bản trước`} variant="secondary" onPress={() => setOpen(!open)} />
    {open ? revisions.map(item => <Card key={item.revision} style={s.stack}>
      <Text>Phiên bản {item.revision} · Đã được thay thế</Text>
      <Text>{item.report.odometer} km · {item.report.fuelLevel == null ? 'Không ghi mức nhiên liệu' : `${item.report.fuelLevel}% nhiên liệu`}</Text>
      {item.report.notes ? <Text>{item.report.notes}</Text> : null}
      <Text>Lý do yêu cầu sửa: {item.report.correctionReason}</Text>
      {item.report.photos.map(photo => <Image key={photo.id} source={{ uri: photo.fileUrl }} style={s.image} accessibilityLabel="Ảnh biên bản phiên bản cũ" />)}
      {item.report.correctionImages?.map(photo => <Image key={photo.publicId} source={{ uri: photo.fileUrl }} style={s.image} accessibilityLabel="Ảnh báo sai lệch" />)}
    </Card>) : null}
  </View>;
}
const s = StyleSheet.create({ stack: { gap: 12 }, image: { width: '100%', height: 180, borderRadius: 24 } });
