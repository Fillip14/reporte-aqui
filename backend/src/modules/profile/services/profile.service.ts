import { SignUp } from '../../auth/schemas/sign-up.schema';
import {
  patchProfile,
  createNewProfile,
  findProfile,
  deleteProfile,
} from '../repositories/profile.repository';

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

export const patchProfileService = async (data: object, user_id: string) => {
  return await patchProfile(data, user_id);
};

export const deleteProfileService = async (userID: string) => {
  return await deleteProfile(userID);
};
