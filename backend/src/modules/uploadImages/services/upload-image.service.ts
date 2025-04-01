import { uploadImage } from '../repositories/upload-image.repository';

export const uploadImageService = async (type: string, file: Express.Multer.File, uuid: string) => {
  return await uploadImage(type, file, uuid);
};
