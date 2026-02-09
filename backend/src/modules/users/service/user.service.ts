import { HttpStatus } from '../../../constants/api.constants';
import { AppError } from '../../../errors/AppError';
import { SignUp } from '../../auth/schemas/sign-up.schema';
import {
  createNewUser,
  deleteUser,
  findUser,
  patchUser,
} from '../../users/repositories/user.repository';

export const findUserService = async (field: string, value: string, columns?: string[]) => {
  const userData = await findUser(field, value);

  if (!columns || columns.length === 0 || !userData) return userData;

  const filteredUser = Object.fromEntries(
    columns
      .filter((col) => col in userData)
      .map((col) => [col, userData[col as keyof typeof userData]]),
  );

  return filteredUser;
};

export const createUserService = async (userData: SignUp) => {
  return await createNewUser(userData);
};

export const patchUserService = async (email: string, userID: string) => {
  const userData = await patchUser(email, userID);

  return userData;
};

export const deleteUserService = async (userID: string) => {
  return await deleteUser(userID);
};
