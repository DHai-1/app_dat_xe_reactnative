import * as ImagePicker from 'expo-image-picker';
import { uploadCustomerImage } from './uploadImage';
import type { SupportImage } from '@datxe/shared';

export async function pickSupportImage(): Promise<SupportImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  const uploaded = await uploadCustomerImage(result.assets[0], 'SUPPORT');
  return { fileUrl: uploaded.secureUrl, publicId: uploaded.publicId };
}
