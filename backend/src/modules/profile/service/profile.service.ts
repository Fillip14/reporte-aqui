import { findUserByID, patchUser, deleteUser } from '../repositories/profile.repository';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const getProfileService = async (userData: ProfileData) => {
  return await findUserByID(userData);
};

export const patchProfileService = async (userData: ProfileUpdate, userId: string) => {
  return await patchUser(userData, userId);
};

export const deleteProfileService = async (userData: ProfileData) => {
  return await deleteUser(userData);
};
