import { userDoesNotExist, create } from '../repositories/signup-repository';
import { Client, Company } from '../schemas/signup-schema';

export const signUpService = {
  async register(userData: Client | Company): Promise<string> {
    const tableType = 'cpf' in userData ? 'users' : 'companies';

    const existingUser = await userDoesNotExist(userData, tableType);

    if (existingUser) throw new Error(`Usuário já existe. ${tableType}`);

    return create(userData, tableType);
  },
};
