import { deleteImage, uploadImage } from '../repositories/image-profile.repository';

export const uploadImageService = async (file: Express.Multer.File, uuid: string) => {
  return await uploadImage(file, uuid);
};

export const deleteImageService = async (uuid: string) => {
  return await deleteImage(uuid);
};
