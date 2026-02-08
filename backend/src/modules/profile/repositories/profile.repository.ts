import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';
import { Column, Table, AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { HttpStatus } from '../../../constants/api.constants';

export const findUserByID = async (user: ProfileData) => {
  const { data: userData, error: userError } = await supabase
    .from(Table.USERS)
    .select('document, email')
    .eq(Column.UUID, user.user_id)
    .maybeSingle();

  if (userError) throw new AppError('Erro ao pesquisar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!userData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

  const { data: profileData, error: profileError } = await supabase
    .from(Table.PROFILES)
    .select('*')
    .eq(Column.USER_ID, user.user_id)
    .maybeSingle();

  if (profileError)
    throw new AppError('Erro ao pesquisar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!profileData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

  return { userData, profileData };
};

export const patchUser = async (user: ProfileUpdate, user_id: string) => {
  const { email, ...userData } = user;

  const { data: usersData, error: usersError } = await supabase
    .from(Table.USERS)
    .update({ email })
    .eq(Column.UUID, user_id);

  if (usersError)
    throw new AppError('Erro ao atualizar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);

  const { data: profileData, error: profileError } = await supabase
    .from(Table.PROFILES)
    .update(userData)
    .eq(Column.USER_ID, user_id);

  if (profileError)
    throw new AppError('Erro ao atualizar perfil do usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
  return;
};

export const deleteUser = async (user: ProfileData) => {
  const { error: userError } = await supabase
    .from(Table.USERS)
    .update({ status: AccountStatus.DELETED, document: null, email: null })
    .eq(Column.UUID, user.user_id);

  if (userError)
    throw new AppError('Erro ao excluir users.', HttpStatus.BAD_REQUEST, {
      success: false,
      suggestedAction: 'delete again',
    });

  const { error: authError } = await supabase
    .from(Table.AUTH)
    .delete()
    .eq(Column.USER_ID, user.user_id);

  if (authError)
    throw new AppError('Erro ao excluir auth.', HttpStatus.BAD_REQUEST, {
      success: false,
      suggestedAction: 'delete again',
    });

  const { error: profileError } = await supabase
    .from(Table.PROFILES)
    .delete()
    .eq(Column.USER_ID, user.user_id);

  if (profileError)
    throw new AppError('Erro ao excluir profile.', HttpStatus.BAD_REQUEST, {
      success: false,
      suggestedAction: 'delete again',
    });
  return;
};
