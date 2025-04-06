import express from 'express';
import {
  uploadImageController,
  deleteImageController,
  downloadImageController,
} from '../controllers/image-profile.controller';
import { uploadMiddlewareSingle } from '../middlewares/storage.middleware';
import { authMiddleware } from '../../../middlewares/middleware';

const storageRoutes = express.Router();

storageRoutes.post(
  '/upload/profile-image',
  authMiddleware(),
  uploadMiddlewareSingle,
  uploadImageController
);

storageRoutes.get('/dowload/profile-image', authMiddleware(), downloadImageController);
storageRoutes.delete('/delete/profile-image', authMiddleware(), deleteImageController);

export default storageRoutes;
