import { findUserByEmail, create } from '../repositories/auth.repository';
import { SignUp } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';

export const signUpService = {
  async register(userData: SignUp): Promise<string> {
    userData.password = await bcrypt.hash(userData.password, 10);

    const existingUser = await findUserByEmail(userData.email);

    if (existingUser) throw new Error(`${userData.type} já existe.`);

    return create(userData);
  },
};
