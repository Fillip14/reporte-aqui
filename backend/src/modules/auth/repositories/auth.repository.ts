import { supabase } from '../../../database/supabaseClient';
import { SignUp } from '../schemas/sign-up.schema';
import { Table, Column } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { HttpStatus } from '../../../constants/api.constants';
import { SignIn } from '../schemas/sign-in.schema';

export const findAuth = async (itemToSearch: SignIn) => {
  const { data: authData, error: authError } = await supabase
    .from(Table.AUTH)
    .select(`${Column.USER_ID}, ${Column.PASSWORD_HASH}`)
    .eq(Column.PROVIDER, itemToSearch.provider)
    .eq(Column.PROVIDER_UID, itemToSearch.providerUid)
    .maybeSingle();

  if (authError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);

  return authData;
};

export const createNewAuth = async (userID: string, userData: SignUp) => {
  const { error: authInsertError } = await supabase
    .from(Table.AUTH)
    .insert({
      user_id: userID,
      provider: userData.provider,
      provider_uid: userData.providerUid,
      password_hash: userData.password,
    })
    .select();

  if (authInsertError)
    throw new AppError('Erro ao cadastrar no auth.', HttpStatus.INTERNAL_SERVER_ERROR);
};

export const deleteAuth = async (userID: string) => {
  const { error: authError } = await supabase.from(Table.AUTH).delete().eq(Column.USER_ID, userID);

  if (authError)
    throw new AppError('Erro ao excluir auth.', HttpStatus.BAD_REQUEST, {
      success: false,
      suggestedAction: 'delete again',
    });

  return;
};
