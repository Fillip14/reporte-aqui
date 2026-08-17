import { describe, it, expect } from 'vitest';
import { buildObjectKey, generateUploadUrl, publicMediaUrl } from './r2.js';
import { env } from '../config/env.js';

describe('r2', () => {
  it('builds an object key prefixed with the user id and a matching extension', () => {
    const imageKey = buildObjectKey('user-123', 'image');
    expect(imageKey).toMatch(/^user-123\/[0-9a-f-]{36}\.jpg$/);

    const videoKey = buildObjectKey('user-123', 'video');
    expect(videoKey).toMatch(/^user-123\/[0-9a-f-]{36}\.mp4$/);
  });

  it('generates different object keys on each call', () => {
    const first = buildObjectKey('user-123', 'image');
    const second = buildObjectKey('user-123', 'image');
    expect(first).not.toBe(second);
  });

  it('generates a presigned PUT URL without making a network call', async () => {
    const objectKey = buildObjectKey('user-123', 'image');
    const url = await generateUploadUrl(objectKey);

    expect(url.startsWith(env.R2_ENDPOINT)).toBe(true);
    expect(url).toContain(objectKey);
    expect(url).toContain('X-Amz-Signature');
  });

  it('builds a public media URL from the configured base', () => {
    const url = publicMediaUrl('user-123/photo.jpg');
    expect(url).toBe(`${env.R2_PUBLIC_URL_BASE}/user-123/photo.jpg`);
  });
});
