import { HttpStatus } from '../../../constants/api.constants';
import { AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { findUser } from '../repositories/auth.repository';
import { SignIn } from '../schemas/sign-in.schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signService = async (userData: SignIn) => {
  const dataFound = await findUser(userData);

  if (dataFound.status != AccountStatus.ACTIVE)
    throw new AppError('Login não autorizado.', HttpStatus.FORBIDDEN, {
      suggestedAction: 'contact_support',
    });

  if (!dataFound || !(await bcrypt.compare(userData.password, dataFound.password_hash)))
    throw new AppError('Email ou senha inválidos.', HttpStatus.UNAUTHORIZED);

  return jwt.sign(
    { user_id: dataFound.user_id, type: dataFound.type },
    process.env.JWT_SECRET as string,
    {
      expiresIn: 5 * 60,
    },
  );
};
