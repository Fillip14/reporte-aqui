import { create, findByEmail } from '../repositories/user-repository';
import { User } from '../schemas/user-schema';

const checkUserDoesNotExist = async (email: User['email']) => {
  const existingUser = await findByEmail(email);
  if (existingUser) throw new Error('Usuário já existe.');
};

export const userService = {
  async register(userData: User) {
    await checkUserDoesNotExist(userData.email);
    return create(userData);
  },
};
