import express from 'express';
import {
  uploadImageController,
  deleteImageController,
} from '../controllers/image-profile.controller';
import { uploadMiddleware } from '../middlewares/file.middleware';
import { authMiddleware } from '../../../middlewares/middleware';

const storageRoutes = express.Router();

storageRoutes.post('/upload/profile', authMiddleware(), uploadMiddleware, uploadImageController);
storageRoutes.delete('/delete/profile', authMiddleware(), deleteImageController);

export default storageRoutes;
