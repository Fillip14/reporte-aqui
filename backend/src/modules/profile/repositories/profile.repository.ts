import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';
import { TABLE_AUTH, TABLE_USERS, COLUMN_USER_ID } from '../../../constants/database.constants';

export const findUserByID = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from(TABLE_AUTH)
    .select('document, email')
    .eq(COLUMN_USER_ID, user.userID)
    .single();

  if (authError) throw new Error('Erro ao pesquisar usuário.');

  const { data: dataUser, error: dataError } = await supabase
    .from(TABLE_USERS)
    .select('*')
    .eq(COLUMN_USER_ID, user.userID)
    .single();

  if (dataError) throw new Error('Erro ao pesquisar usuário.');

  return { authUser, dataUser };
};

export const patchUser = async (user: ProfileUpdate, userID: string) => {
  const { email, ...userData } = user;
  const { data: authUser, error: authError } = await supabase
    .from(TABLE_AUTH)
    .update({ email })
    .eq(COLUMN_USER_ID, userID);

  const { data: dataUser, error: dataError } = await supabase
    .from(TABLE_USERS)
    .update(userData)
    .eq(COLUMN_USER_ID, userID);

  if (authError || dataError) throw new Error('Erro ao atualizar usuário.');

  return;
};

export const deleteUser = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from(TABLE_AUTH)
    .delete()
    .eq(COLUMN_USER_ID, user.userID);

  if (authError) throw new Error('Erro ao excluir o usuário.');
  return;
};
