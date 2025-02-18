import { findUserByEmail } from '../repositories/auth.repository';
import { SignIn } from '../schemas/sign-in.schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signInService = {
  async login(userData: SignIn) {
    const dataFound = await findUserByEmail(userData.email);

    if (!dataFound || !(await bcrypt.compare(userData.password, dataFound.password))) {
      throw new Error('Email ou senha inválidos.');
    }
    return jwt.sign({ id: dataFound.id, type: dataFound.type }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });
  },
};
