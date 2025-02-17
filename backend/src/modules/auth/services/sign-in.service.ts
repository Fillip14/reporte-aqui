import { findUserByEmail } from '../repositories/auth.repository';
import { SignIn } from '../schemas/sign-in.schema';
import bcrypt from 'bcrypt';

const checkPassword = async (plainPassword: string, hashedPassword: string) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

export const signInService = {
  async login(userData: SignIn): Promise<void> {
    const existingUser = await findUserByEmail(userData.email);

    if (!existingUser) throw new Error(`Email não encontrado.`);

    const isPasswordCorrect = await checkPassword(
      userData.password,
      existingUser.password
    );

    console.log(isPasswordCorrect);
  },
};
