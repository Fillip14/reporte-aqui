import express from 'express';
import { uploadImageController } from '../controllers/upload-image.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authMiddleware } from '../../../middlewares/middleware';

const routesUploadImage = express.Router();

routesUploadImage.post('/upload/:type', authMiddleware(), uploadMiddleware, uploadImageController);

export default routesUploadImage;
