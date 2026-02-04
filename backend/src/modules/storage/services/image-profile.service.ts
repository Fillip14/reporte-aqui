import { deleteImage, downloadImage, uploadImage } from '../repositories/image-profile.repository';

export const uploadImageService = async (file: Express.Multer.File, userID: string) => {
  return await uploadImage(file, userID);
};

export const downloadImageService = async (userID: string) => {
  return await downloadImage(userID);
};

export const deleteImageService = async (userID: string) => {
  return await deleteImage(userID);
};
