import { userDoesNotExist, create } from '../repositories/signup-repository';
import { Client, Company } from '../schemas/signup-schema';

export const signUpService = {
  async register(userData: Client | Company): Promise<string> {
    const existingUser = await userDoesNotExist(userData);

    if (existingUser) throw new Error(`Usuário já existe. ${userData.type}`);

    return create(userData);
  },
};
