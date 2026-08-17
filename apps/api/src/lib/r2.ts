import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const UPLOAD_URL_TTL_SECONDS = 300;

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const EXTENSION_BY_MEDIA_TYPE: Record<'image' | 'video', string> = {
  image: 'jpg',
  video: 'mp4',
};

export function buildObjectKey(userId: string, mediaType: 'image' | 'video'): string {
  return `${userId}/${crypto.randomUUID()}.${EXTENSION_BY_MEDIA_TYPE[mediaType]}`;
}

export async function generateUploadUrl(objectKey: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: objectKey });
  return getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

export function publicMediaUrl(objectKey: string): string {
  return `${env.R2_PUBLIC_URL_BASE}/${objectKey}`;
}
