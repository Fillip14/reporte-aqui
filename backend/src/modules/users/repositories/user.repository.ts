import { supabase } from '../../../database/supabaseClient';
import { Table, Column, AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { HttpStatus } from '../../../constants/api.constants';
import { SignUp } from '../../auth/schemas/sign-up.schema';

export const findUser = async (field: string, value: string) => {
  const { data: userData, error: userError } = await supabase
    .from(Table.USERS)
    .select('*')
    .eq(field, value)
    .maybeSingle();

  if (userError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);

  return userData;
};

export const createNewUser = async (userData: SignUp): Promise<string> => {
  const { data: newUser, error: userInsertError } = await supabase
    .from(Table.USERS)
    .insert({
      type: userData.type,
      status: AccountStatus.ACTIVE,
      email: userData.email,
      document: userData.document,
    })
    .select(Column.UUID)
    .single();

  if (userInsertError)
    throw new AppError('Erro ao cadastrar no users.', HttpStatus.INTERNAL_SERVER_ERROR);

  return newUser.uuid;
};

export const patchUser = async (email: string, userID: string) => {
  const { error: userError } = await supabase
    .from(Table.USERS)
    .update({ email })
    .eq(Column.UUID, userID);

  if (userError) throw new AppError('Erro ao atualizar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);

  return;
};

export const deleteUser = async (userID: string) => {
  const { error: userError } = await supabase
    .from(Table.USERS)
    .update({ status: AccountStatus.DELETED, document: null, email: null })
    .eq(Column.UUID, userID);

  if (userError)
    throw new AppError('Erro ao excluir usuario.', HttpStatus.BAD_REQUEST, {
      success: false,
      suggestedAction: 'delete again',
    });

  return;
};
