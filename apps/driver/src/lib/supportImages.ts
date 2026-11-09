import * as ImagePicker from 'expo-image-picker';
import { uploadDriverImage } from './uploadImage';
import type { CustomerImageFile, SupportImage } from '@datxe/shared';

export async function pickSupportImage(): Promise<SupportImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  const uploaded = await uploadDriverImage(result.assets[0], 'SUPPORT');
  return { fileUrl: uploaded.secureUrl, publicId: uploaded.publicId };
}

/** Chỉ chọn ảnh và trả file local; upload diễn ra lúc bấm Gửi trong ticket chat. */
export async function pickTicketImage(): Promise<CustomerImageFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType };
}
