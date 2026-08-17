import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as mediaController from './media.controller.js';

const mediaRouter = Router();

mediaRouter.post('/upload-url', requireAuth, mediaController.createUploadUrl);

export default mediaRouter;
