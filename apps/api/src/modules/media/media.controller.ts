import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import { uploadUrlSchema } from './media.validation.js';
import { buildObjectKey, generateUploadUrl } from '../../lib/r2.js';

export async function createUploadUrl(req: AuthenticatedRequest, res: Response) {
  const parsed = uploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  const objectKey = buildObjectKey(req.user!.id, parsed.data.mediaType);
  const uploadUrl = await generateUploadUrl(objectKey);
  return res.status(200).json({ objectKey, uploadUrl });
}
