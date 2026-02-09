import { HttpStatus } from '../../../constants/api.constants';
import { AccountStatus, Column } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { findUserService } from '../../users/service/user.service';
import { findAuthService } from './auth.service';
import { SignIn } from '../schemas/sign-in.schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signService = async (userData: SignIn) => {
  const dataAuth = await findAuthService(userData);
  const dataUser = await findUserService(Column.UUID, dataAuth.user_id, [
    Column.STATUS,
    Column.TYPE,
  ]);

  if (dataUser[0].status != AccountStatus.ACTIVE)
    throw new AppError('Login não autorizado.', HttpStatus.FORBIDDEN, {
      suggestedAction: 'contact_support',
    });

  if (!(await bcrypt.compare(userData.password, dataAuth.password_hash)))
    throw new AppError('Email ou senha inválidos.', HttpStatus.UNAUTHORIZED);

  return jwt.sign(
    { user_id: dataAuth.user_id, type: dataUser[0].type },
    process.env.JWT_SECRET as string,
    {
      expiresIn: 5 * 60,
    },
  );
};
