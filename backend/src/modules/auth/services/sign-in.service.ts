import { findUser } from '../repositories/auth.repository';
import { SignIn } from '../schemas/sign-in.schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signInService = {
  async login(userData: SignIn) {
    const dataFound = await findUser(userData);

    if (
      !dataFound ||
      !(await bcrypt.compare(userData.password, dataFound.authUser.password_hash))
    ) {
      throw new Error('Email ou senha inválidos.');
    }

    return jwt.sign(
      { userID: dataFound.authUser.user_id, type: dataFound.dataUser.type },
      process.env.JWT_SECRET as string,
      {
        expiresIn: 5 * 60,
      },
    );
  },
};
