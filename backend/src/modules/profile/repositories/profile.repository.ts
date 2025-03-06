import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const findUserByID = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .select('document, email')
    .eq('uuid', user.uuid)
    .single();

  if (authError) throw new Error('Erro ao pesquisar usuário.');

  const { data: dataUser, error: dataError } = await supabase
    .from('users')
    .select('*')
    .eq('uuid', user.uuid)
    .single();

  if (dataError) throw new Error('Erro ao pesquisar usuário.');

  return { authUser, dataUser };
};

export const patchUser = async (user: ProfileUpdate, userId: string) => {
  const { email, ...userData } = user;
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .update(email)
    .eq('uuid', userId);

  const { data: dataUser, error: dataError } = await supabase
    .from('users')
    .update(userData)
    .eq('uuid', userId);

  if (authError || dataError) throw new Error('Erro ao atualizar usuário.');

  return;
};

export const deleteUser = async (user: ProfileData) => {
  const { data: authUser, error: authError } = await supabase
    .from('auth')
    .delete()
    .eq('uuid', user.uuid);

  if (authError) throw new Error('Erro ao excluir o usuário.');
  return;
};
