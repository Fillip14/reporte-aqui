import { createNewAuth, findAuth } from '../repositories/auth.repository';
import { SignIn } from '../schemas/sign-in.schema';
import { SignUp } from '../schemas/sign-up.schema';

export const findAuthService = async (userData: SignIn) => {
  return await findAuth(userData);
};

export const createAuthService = async (userID: string, userData: SignUp) => {
  return await createNewAuth(userID, userData);
};
