import { SignUp } from '../../auth/schemas/sign-up.schema';
import { createNewUser, findUser } from '../../users/repositories/user.repository';

export const findUserService = async (field: string, value: string, columns?: string[]) => {
  const columnsSearch = !columns || columns.length === 0 ? '*' : `${columns}`;
  return await findUser(columnsSearch, field, value);
};

export const createUserService = async (userData: SignUp) => {
  return await createNewUser(userData);
};
