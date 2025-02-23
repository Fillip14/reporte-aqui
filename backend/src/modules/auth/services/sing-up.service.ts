import { findRegisteredUser, create } from '../repositories/auth.repository';
import { SignUp } from '../schemas/sign-up.schema';
import bcrypt from 'bcrypt';

export const signUpService = {
  async register(userData: SignUp) {
    await signUpService.findUser(userData.document);

    userData.password = await bcrypt.hash(userData.password, 10);

    const existingUser = await findRegisteredUser(userData.email);

    if (existingUser) throw new Error(`Email já cadastrado.`);

    return create(userData);
  },

  async findUser(document: SignUp['document']) {
    const existingUser = await findRegisteredUser(document);

    if (existingUser) throw new Error(`Usuário já cadastrado.`);
  },
};
