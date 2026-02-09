import { SignUp } from '../../auth/schemas/sign-up.schema';
import {
  findUserByID,
  patchUser,
  deleteUser,
  createNewProfile,
} from '../repositories/profile.repository';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const createProfileService = async (userID: string, userData: SignUp) => {
  return await createNewProfile(userID, userData);
};

export const getProfileService = async (userData: ProfileData) => {
  return await findUserByID(userData);
};

export const patchProfileService = async (userData: ProfileUpdate, user_id: string) => {
  return await patchUser(userData, user_id);
};

export const deleteProfileService = async (userData: ProfileData) => {
  return await deleteUser(userData);
};
