import { supabase } from '../../../database/supabaseClient';
import { Table, Column, AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { HttpStatus } from '../../../constants/api.constants';
import { SignUp } from '../../auth/schemas/sign-up.schema';

export const findUser = async (columns: string, field: string, value: string): Promise<any[]> => {
  const { data: userData, error: userError } = await supabase
    .from(Table.USERS)
    .select(`${columns}`)
    .eq(field, value);

  if (userError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!userData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

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
