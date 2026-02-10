import { HttpStatus } from '../../../constants/api.constants';
import { AppError } from '../../../errors/AppError';
import { SignUp } from '../../auth/schemas/sign-up.schema';
import { deleteAuthService } from '../../auth/services/auth.service';
import { deleteUserService, patchUserService } from '../../users/services/user.service';
import {
  patchProfile,
  createNewProfile,
  findProfile,
  deleteProfile,
} from '../repositories/profile.repository';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const findProfileService = async (field: string, value: string, columns?: string[]) => {
  const userData = await findProfile(field, value);

  if (!columns || columns.length === 0 || !userData) return userData;

  const filteredUser = Object.fromEntries(
    columns
      .filter((col) => col in userData)
      .map((col) => [col, userData[col as keyof typeof userData]]),
  );

  return filteredUser;
};

export const createProfileService = async (userID: string, userData: SignUp) => {
  return await createNewProfile(userID, userData);
};

export const patchProfileService = async (userData: ProfileUpdate, user_id: string) => {
  const { email, ...data } = userData;

  await patchUserService(email, user_id);
  await patchProfile(data, user_id);

  return;
};

export const deleteProfileService = async (userData: ProfileData) => {
  const userID = userData.user_id;
  try {
    await deleteProfile(userID);
    await deleteUserService(userID);
    await deleteAuthService(userID);
  } catch (error) {
    throw new AppError('Erro ao excluir perfil.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return;
};
