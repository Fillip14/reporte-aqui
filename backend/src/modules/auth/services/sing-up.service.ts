import { createAuthService } from './auth.service';
import { createUserService, findUserService } from '../../users/service/user.service';
import { createProfileService } from '../../profile/service/profile.service';
import { HttpStatus } from '../../../constants/api.constants';
import { AppError } from '../../../errors/AppError';
import { SignUp } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';
import { Column } from '../../../constants/database.constants';

export const registerUserService = async (userData: SignUp) => {
  const userByDocument = await findUserService(Column.DOCUMENT, userData.document);
  const userByEmail = await findUserService(Column.EMAIL, userData.email);

  if (userByDocument)
    throw new AppError('Documento ja cadastrado.', HttpStatus.CONFLICT, { field: 'document' });

  if (userByEmail)
    throw new AppError('Email ja cadastrado.', HttpStatus.CONFLICT, { field: 'email' });

  userData.password = await bcrypt.hash(userData.password, 10);

  try {
    const userID = await createUserService(userData);
    await createAuthService(userID, userData);
    await createProfileService(userID, userData);

    return userID;
  } catch (error) {
    throw new AppError('Erro ao cadastrar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};
