import { request } from '@/lib/api';
import type { CustomerImageFile } from '@datxe/shared';
import { AuthApiError } from '@datxe/shared';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { getFirebaseUser } from '@datxe/shared';
import * as FileSystem from 'expo-file-system/legacy';

type UploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

async function uploadNativeMultipart(
  url: string,
  file: CustomerImageFile,
  parameters: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  return FileSystem.uploadAsync(url, file.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: file.mimeType || 'image/jpeg',
    parameters,
    headers,
  });
}

async function parseUploadBody(body: string): Promise<UploadResponse> {
  try {
    return JSON.parse(body) as UploadResponse;
  } catch {
    return {};
  }
}

async function uploadThroughBackend(file: CustomerImageFile, purpose: string) {
  const user = getFirebaseUser();
  if (!user) throw new AuthApiError('Phiên đăng nhập đã hết hạn.', 'NO_AUTH_USER');
  const token = await user.getIdToken();
  const fileName = file.fileName || `driver-image-${Date.now()}.jpg`;
  let responseStatus: number;
  let responseBody: string;
  if (Platform.OS === 'web') {
    const form = new FormData();
    const localImage = await fetch(file.uri);
    form.append('file', await localImage.blob(), fileName);
    const response = await fetch(`${env.apiUrl}/uploads/image?purpose=${encodeURIComponent(purpose)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    responseStatus = response.status;
    responseBody = await response.text();
  } else {
    const response = await uploadNativeMultipart(
      `${env.apiUrl}/uploads/image?purpose=${encodeURIComponent(purpose)}`,
      file,
      {},
      { Authorization: `Bearer ${token}` },
    );
    responseStatus = response.status;
    responseBody = response.body;
  }
  const envelope = await parseUploadBody(responseBody) as UploadResponse & {
    success?: boolean;
    data?: { secureUrl?: string; publicId?: string; secure_url?: string; public_id?: string };
  };
  const secureUrl = envelope.data?.secureUrl ?? envelope.data?.secure_url;
  const publicId = envelope.data?.publicId ?? envelope.data?.public_id;
  if (responseStatus < 200 || responseStatus >= 300 || !envelope.success || !secureUrl || !publicId) {
    throw new AuthApiError(envelope.error?.message ?? 'Backend không nhận được ảnh.', 'UPLOAD_FAILED');
  }
  return { secureUrl, publicId };
}
export async function uploadDriverImage(
  file: CustomerImageFile,
  purpose = 'DEFAULT',
  rideId?: number,
): Promise<{ secureUrl: string; publicId: string }> {
  const query = new URLSearchParams({ purpose });
  if (rideId !== undefined) query.set('rideId', String(rideId));
  const signature = (await request<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    allowedFormats: string[] | null;
  }>(`/uploads/signature?${query.toString()}`))!;
  const fileName = file.fileName || `driver-image-${Date.now()}.jpg`;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  let responseStatus: number;
  let responseBody: string;
  try {
    if (Platform.OS === 'web') {
      const form = new FormData();
      const localImage = await fetch(file.uri);
      form.append('file', await localImage.blob(), fileName);
      form.append('api_key', signature.apiKey);
      form.append('timestamp', String(signature.timestamp));
      form.append('signature', signature.signature);
      form.append('folder', signature.folder);
      if (signature.allowedFormats?.length) form.append('allowed_formats', signature.allowedFormats.join(','));
      const result = await fetch(cloudinaryUrl, { method: 'POST', body: form });
      responseStatus = result.status;
      responseBody = await result.text();
    } else {
      const result = await uploadNativeMultipart(cloudinaryUrl, file, {
        api_key: signature.apiKey,
        timestamp: String(signature.timestamp),
        signature: signature.signature,
        folder: signature.folder,
        ...(signature.allowedFormats?.length ? { allowed_formats: signature.allowedFormats.join(',') } : {}),
      });
      responseStatus = result.status;
      responseBody = result.body;
    }
  } catch {
    return uploadThroughBackend(file, purpose);
  }
  const uploaded = await parseUploadBody(responseBody);
  if (responseStatus < 200 || responseStatus >= 300 || !uploaded.secure_url || !uploaded.public_id) {
    return uploadThroughBackend(file, purpose);
  }
  return { secureUrl: uploaded.secure_url, publicId: uploaded.public_id };
}
