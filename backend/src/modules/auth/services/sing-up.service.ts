import { AccountStatus } from '../../../constants/database.constants';
import { findRegisteredUser, create } from '../repositories/auth.repository';
import { HttpStatus } from '../../../constants/api.constants';
import { AppError } from '../../../errors/AppError';
import { SignUp } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';

export const registerUserService = async (userData: SignUp) => {
  const userByDocument = await findRegisteredUser(userData.document, 'document');
  const userByEmail = await findRegisteredUser(userData.email, 'email');

  if (userByDocument[0])
    throw new AppError('Documento ja cadastrado.', HttpStatus.CONFLICT, { field: 'document' });

  if (userByEmail[0])
    throw new AppError('Email ja cadastrado.', HttpStatus.CONFLICT, { field: 'email' });

  userData.password = await bcrypt.hash(userData.password, 10);

  return await create(userData);
};
