import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { inferMediaType, requestUploadUrl, uploadFileToR2, uploadMedia } from './media';

describe('media api', () => {
  it('inferMediaType detects video by mime type', () => {
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    const image = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    expect(inferMediaType(video)).toBe('video');
    expect(inferMediaType(image)).toBe('image');
  });

  it('requestUploadUrl posts the mediaType and returns the presigned URL', async () => {
    server.use(
      http.post('/api/media/upload-url', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ mediaType: 'image' });
        return HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' });
      }),
    );

    const result = await requestUploadUrl('image');
    expect(result.objectKey).toBe('u1/a.jpg');
  });

  it('uploadFileToR2 PUTs the file to the presigned URL', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    let received = false;
    server.use(
      http.put('https://r2.example.com/u1/a.jpg', () => {
        received = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await uploadFileToR2('https://r2.example.com/u1/a.jpg', file);
    expect(received).toBe(true);
  });

  it('uploadFileToR2 throws when the upload fails', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    server.use(http.put('https://r2.example.com/bad', () => new HttpResponse(null, { status: 500 })));

    await expect(uploadFileToR2('https://r2.example.com/bad', file)).rejects.toThrow();
  });

  it('uploadMedia requests a URL then uploads the file', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    server.use(
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' }),
      ),
      http.put('https://r2.example.com/u1/a.jpg', () => new HttpResponse(null, { status: 200 })),
    );

    const result = await uploadMedia(file);
    expect(result).toEqual({ objectKey: 'u1/a.jpg', mediaType: 'image' });
  });
});
