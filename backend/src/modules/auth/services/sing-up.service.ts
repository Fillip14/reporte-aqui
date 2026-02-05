import { findRegisteredUser, create } from '../repositories/auth.repository';
import { SignUp, DocumentOrEmail } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';

export const findUserService = async (
  value: DocumentOrEmail['value'],
  field: DocumentOrEmail['field'],
) => {
  const existingUser = await findRegisteredUser(value, field);

  if (existingUser) throw new Error(`${field} já cadastrado.`);
};

export const registerUserService = async (userData: SignUp) => {
  await findUserService(userData.email, 'email');
  await findUserService(userData.document, 'document');

  userData.password = await bcrypt.hash(userData.password, 10);

  return create(userData);
};
