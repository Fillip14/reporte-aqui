import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const findUserByID = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .select('document, email')
    .eq('userID', user.userID)
    .single();

  if (authError) throw new Error('Erro ao pesquisar usuário.');

  const { data: dataUser, error: dataError } = await supabase
    .from('users')
    .select('*')
    .eq('userID', user.userID)
    .single();

  if (dataError) throw new Error('Erro ao pesquisar usuário.');

  return { authUser, dataUser };
};

export const patchUser = async (user: ProfileUpdate, userID: string) => {
  const { email, ...userData } = user;
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .update({ email })
    .eq('userID', userID);

  const { data: dataUser, error: dataError } = await supabase
    .from('users')
    .update(userData)
    .eq('userID', userID);

  if (authError || dataError) throw new Error('Erro ao atualizar usuário.');

  return;
};

export const deleteUser = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .delete()
    .eq('userID', user.userID);

  if (authError) throw new Error('Erro ao excluir o usuário.');
  return;
};
