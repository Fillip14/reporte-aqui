import { findUserByID, patchUser } from '../repositories/profile.repository';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const getProfileService = async (userData: ProfileData) => {
  const data = await findUserByID(userData);
  if (!data) throw new Error('ID ou Type do usuario faltando ou incorreto.');
  return data;
};

export const patchProfileService = async (userData: ProfileUpdate) => {
  const { data, error } = await patchUser(userData);
  if (error) throw new Error('Erro ao atualizar usuário.');
  return data;
};
