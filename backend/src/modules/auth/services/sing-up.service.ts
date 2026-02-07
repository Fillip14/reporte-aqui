import { AccountStatus } from '../../../constants/database.constants';
import { findRegisteredUser, create } from '../repositories/auth.repository';
import { HttpStatus } from '../../../constants/api.constants';
import { AppError } from '../../../errors/AppError';
import { SignUp } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';

export const registerUserService = async (userData: SignUp) => {
  const userByDocument = await findRegisteredUser(userData.document, 'document');
  const userByEmail = await findRegisteredUser(userData.email, 'email');

  const userFromDocument = userByDocument?.[0];
  const userFromEmail = userByEmail?.[0];

  if (userFromEmail && !userFromDocument)
    throw new AppError('Email ja cadastrado.', HttpStatus.CONFLICT, { field: 'email' });

  if (userFromDocument && userFromEmail) {
    if (userFromDocument.uuid !== userFromEmail.uuid)
      throw new AppError('CPF e email pertencem a contas diferentes.', HttpStatus.CONFLICT, {
        error: 'CPF e email pertencem a contas diferentes.',
      });
  }

  const existingUser = userFromDocument ?? userFromEmail;

  if (existingUser) {
    const status = existingUser.status;

    switch (status) {
      case AccountStatus.ACTIVE:
        return {
          type: 'EXISTS',
          status: status,
          suggestedAction: 'login',
        };

      case AccountStatus.PENDING:
      case AccountStatus.SUSPENDED:
        return {
          type: 'EXISTS',
          status: status,
          suggestedAction: 'contact_support',
        };

      case AccountStatus.DELETED:
        break;
    }
  }

  userData.password = await bcrypt.hash(userData.password, 10);

  const userRegistered = await create(userData, existingUser?.uuid);

  return {
    type: 'CREATED',
    userID: userRegistered,
  };
};
