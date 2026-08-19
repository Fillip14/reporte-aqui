import { apiFetch } from './client';
import type { MediaType } from './problems';

export function inferMediaType(file: File): MediaType {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

export function requestUploadUrl(mediaType: MediaType): Promise<{ objectKey: string; uploadUrl: string }> {
  return apiFetch<{ objectKey: string; uploadUrl: string }>('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({ mediaType }),
  });
}

export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

export async function uploadMedia(file: File): Promise<{ objectKey: string; mediaType: MediaType }> {
  const mediaType = inferMediaType(file);
  const { objectKey, uploadUrl } = await requestUploadUrl(mediaType);
  await uploadFileToR2(uploadUrl, file);
  return { objectKey, mediaType };
}
