import { uploadDriverImage } from '@/lib/uploadImage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { getDriverActiveRide, submitDriverHandover } from '../api';
export const PHOTO_ANGLES = [['FRONT', 'Đầu xe'], ['BACK', 'Đuôi xe'], ['LEFT', 'Bên trái'], ['RIGHT', 'Bên phải'], ['DASHBOARD', 'Đồng hồ (tùy chọn)']] as const;
type Photo = { angle: string; uri: string; fileUrl: string; publicId: string };
export function useVehicleInspection() {
  const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide });
  const ride = query.data; const phase = ride && ['ARRIVED_DESTINATION', 'VEHICLE_RETURNED'].includes(ride.status) ? 'dropoff' : 'pickup';
  const existing = ride?.handoverReports.find(report => report.phase === phase.toUpperCase());
  const scope=String(ride?.id)+':'+phase;
  const [draft,setDraft]=useState({scope,photos:[] as Photo[],odometer:'',fuelLevel:'',notes:''});
  if(draft.scope!==scope)setDraft({scope,photos:[],odometer:'',fuelLevel:'',notes:''});
  const {photos,odometer,fuelLevel,notes}=draft.scope===scope?draft:{photos:[],odometer:'',fuelLevel:'',notes:''};
  const setOdometer=(value:string)=>setDraft(previous=>previous.scope===scope?{...previous,odometer:value}:previous);
  const setFuelLevel=(value:string)=>setDraft(previous=>previous.scope===scope?{...previous,fuelLevel:value}:previous);
  const setNotes=(value:string)=>setDraft(previous=>previous.scope===scope?{...previous,notes:value}:previous);
  const [uploading,setUploading]=useState<string|null>(null);
  const capture = async (angle: string) => {
    if (!ride || uploading) return;
    const capturedScope=scope;
    try {
      if (!(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Cần quyền camera để chụp ảnh bàn giao.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      setUploading(angle);
      const asset = result.assets[0]; const uploaded = await uploadDriverImage(asset, 'HANDOVER', ride.id);
      setDraft(current => current.scope===capturedScope ? {...current,photos:[...current.photos.filter(photo => photo.angle !== angle), { angle, uri: asset.uri, fileUrl: uploaded.secureUrl, publicId: uploaded.publicId }]} : current);
    } catch (error) { Alert.alert('Chưa tải được ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
    finally { setUploading(null); }
  };
  const submit = useMutation({ mutationFn: async () => {
    if (!ride) throw new Error('Chưa có chuyến đang hoạt động.');
    if (!odometer.trim() || !Number.isSafeInteger(Number(odometer)) || Number(odometer) < 0) throw new Error('Nhập số km đồng hồ hợp lệ.');
    if (fuelLevel && (!Number.isInteger(Number(fuelLevel)) || Number(fuelLevel) < 0 || Number(fuelLevel) > 100)) throw new Error('Mức nhiên liệu phải là số nguyên từ 0 đến 100%.');
    if (PHOTO_ANGLES.slice(0, 4).some(([angle]) => !photos.some(photo => photo.angle === angle))) throw new Error('Cần đủ ảnh đầu xe, đuôi xe, bên trái và bên phải.');
    return submitDriverHandover(ride.id, phase, { odometer: Number(odometer), fuelLevel: fuelLevel ? Number(fuelLevel) : null, notes: notes.trim() || null, photos: photos.map(({ angle, fileUrl, publicId }) => ({ angle, fileUrl, publicId })) });
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); Alert.alert('Đã gửi biên bản', 'Khách hàng cần kiểm tra và xác nhận biên bản.'); } });
  const editable = Boolean(ride && !existing && (phase === 'pickup' ? ride.status === 'DRIVER_ARRIVED' : ride.status === 'ARRIVED_DESTINATION'));
  return { router, ride, phase, existing, photos, uploading, odometer, setOdometer, fuelLevel, setFuelLevel, notes, setNotes, capture, submit, editable, loading: query.isLoading, error: query.error?.message || submit.error?.message };
}
