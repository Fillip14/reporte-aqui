import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';
import { Column, Table, AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';

export const findUserByID = async (user: ProfileData) => {
  const { data: usersData, error: usersError } = await supabase
    .from(Table.USERS)
    .select('document, email')
    .eq(Column.UUID, user.user_id)
    .single();

  if (usersError) throw new AppError('Erro ao pesquisar usuário.');

  const { data: profileData, error: profileError } = await supabase
    .from(Table.PROFILES)
    .select('*')
    .eq(Column.USER_ID, user.user_id)
    .single();

  if (profileError) throw new AppError('Erro ao pesquisar usuário.');

  return { usersData, profileData };
};

export const patchUser = async (user: ProfileUpdate, user_id: string) => {
  const { email, ...userData } = user;

  const { data: usersData, error: usersError } = await supabase
    .from(Table.USERS)
    .update({ email })
    .eq(Column.UUID, user_id);

  if (usersError) throw new AppError('Erro ao atualizar usuário.');

  const { data: profileData, error: profileError } = await supabase
    .from(Table.PROFILES)
    .update(userData)
    .eq(Column.USER_ID, user_id);

  if (profileError) throw new AppError('Erro ao atualizar usuário.');
  return;
};

export const deleteUser = async (user: ProfileData) => {
  const { data: usersData, error: usersError } = await supabase
    .from(Table.USERS)
    .update({ status: AccountStatus.DELETED })
    .eq(Column.UUID, user.user_id);

  if (usersError) throw new Error('Erro ao excluir o usuário.');
  return;
};
