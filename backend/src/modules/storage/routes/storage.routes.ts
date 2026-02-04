import { Router } from 'express';
import imageProfileRoutes from './image-profile.routes';

const storageRoutes = Router();

storageRoutes.use(imageProfileRoutes);

export default storageRoutes;
