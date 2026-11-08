import { uploadDriverImage } from '@/lib/uploadImage';
import { request } from '@/lib/api';
import { getFirebaseUser, type CustomerRideDetail } from '@datxe/shared';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getDriverActiveRide, submitDriverHandover, reviseDriverHandover } from '../api';
import { PHOTO_ANGLES } from '../photoAngles';
type Photo = { angle: string; uri: string; fileUrl: string; publicId: string };
type Draft = { photos: Photo[]; odometer?: string; fuelLevel?: string; notes?: string };
export function useVehicleInspection() {
  const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide, refetchInterval: 5000 });
  const ride = query.data; const phase: 'pickup' | 'dropoff' = ride && ['ARRIVED_DESTINATION', 'VEHICLE_RETURNED'].includes(ride.status) ? 'dropoff' : 'pickup';
  const existing = ride?.handoverReports.find(report => report.phase === phase.toUpperCase());
  const scope=String(ride?.id)+':'+phase+':'+(existing?.revision ?? 1)+':'+(existing?.correctionReason ?? '');
  const revisions = useQuery({ queryKey: ['driver', 'handoverRevisions', ride?.id, phase, existing?.revision], enabled: Boolean(existing && ride), queryFn: async () => (await request<{ revision: number; report: CustomerRideDetail['handoverReports'][number]; requestedAt: string }[]>(`/driver/rides/${ride!.id}/handover/${phase}/revisions`))! });
  const uid = getFirebaseUser()?.uid;
  const draftKey = ['driverDraft', 'handover', uid, scope];
  const { data: draft = { photos: [] } } = useQuery<Draft>({ queryKey: draftKey, queryFn: skipToken });
  const { photos } = draft;
  const odometer = draft.odometer ?? (existing ? String(existing.odometer) : '');
  const fuelLevel = draft.fuelLevel ?? (existing?.fuelLevel != null ? String(existing.fuelLevel) : '');
  const notes = draft.notes ?? existing?.notes ?? '';
  const updateDraft = (fields: Partial<Draft>) => {
    if (uid && uid === getFirebaseUser()?.uid) client.setQueryData<Draft>(draftKey, (current) => ({ photos: [], ...current, ...fields }));
  };
  const setOdometer = (value: string) => updateDraft({ odometer: value });
  const setFuelLevel = (value: string) => updateDraft({ fuelLevel: value });
  const setNotes = (value: string) => updateDraft({ notes: value });
  const [uploading, setUploading] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<{ scope: string; angle: string; message: string } | null>(null);
  const capture = async (angle: string) => {
    if (!ride || !uid || uploading) return;
    const capturedScope=scope;
    setPhotoError(null);
    setUploading(angle);
    try {
      if (!(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Cần quyền camera để chụp ảnh bàn giao.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      if (getFirebaseUser()?.uid !== uid) return;
      const asset = result.assets[0]; const uploaded = await uploadDriverImage(asset, 'HANDOVER', ride.id);
      updateDraft({ photos: [...photos.filter((photo) => photo.angle !== angle), { angle, uri: asset.uri, fileUrl: uploaded.secureUrl, publicId: uploaded.publicId }] });
    } catch (error) { setPhotoError({ scope: capturedScope, angle, message: error instanceof Error ? error.message : 'Chưa tải được ảnh. Hãy thử lại.' }); }
    finally { setUploading(null); }
  };
  const submit = useMutation({ mutationFn: async () => {
    if (!uid || getFirebaseUser()?.uid !== uid) throw new Error('Phiên đăng nhập đã thay đổi.');
    if (!ride) throw new Error('Chưa có chuyến đang hoạt động.');
    if (!odometer.trim() || !Number.isSafeInteger(Number(odometer)) || Number(odometer) < 0) throw new Error('Nhập số km đồng hồ hợp lệ.');
    if (fuelLevel && (!Number.isInteger(Number(fuelLevel)) || Number(fuelLevel) < 0 || Number(fuelLevel) > 100)) throw new Error('Mức nhiên liệu phải là số nguyên từ 0 đến 100%.');
    if (PHOTO_ANGLES.slice(0, 4).some(([angle]) => !photos.some(photo => photo.angle === angle))) throw new Error('Cần đủ ảnh đầu xe, đuôi xe, bên trái và bên phải.');
    const body = { odometer: Number(odometer), fuelLevel: fuelLevel ? Number(fuelLevel) : null, notes: notes.trim() || null, photos: photos.map(({ angle, fileUrl, publicId }) => ({ angle, fileUrl, publicId })) };
    return existing ? reviseDriverHandover(ride.id, phase, existing.revision ?? 1, body) : submitDriverHandover(ride.id, phase, body);
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['driver'] }); if (getFirebaseUser()?.uid === uid) client.setQueryData<Draft>(draftKey, { photos: [] }); }, onError: () => { void query.refetch(); } });
  const editable = Boolean(ride && ((!existing && (phase === 'pickup' ? ride.status === 'DRIVER_ARRIVED' : ride.status === 'ARRIVED_DESTINATION')) || (existing?.correctionReason && !existing.confirmedByCustomer && (phase === 'pickup' ? ride.status === 'VEHICLE_HANDOVER' : ride.status === 'VEHICLE_RETURNED'))));
  return { router, ride, phase, existing, photos, uploading, photoError: photoError?.scope === scope ? photoError : null, refresh: query.refetch, odometer, setOdometer, fuelLevel, setFuelLevel, notes, setNotes, capture, submit, editable, revisions, loading: query.isLoading, error: query.error?.message || submit.error?.message };
}
