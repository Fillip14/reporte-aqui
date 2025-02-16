import { userDoesNotExist, create } from '../repositories/signup-repository';
import { Client, Company } from '../schemas/signup-schema';
import bcrypt from 'bcrypt';

export const signUpService = {
  async register(userData: Client | Company): Promise<string> {
    userData.password = await bcrypt.hash(userData.password, 10);

    const existingUser = await userDoesNotExist(userData);

    if (existingUser) throw new Error(`Usuário já existe. ${userData.type}`);

    return create(userData);
  },
};
