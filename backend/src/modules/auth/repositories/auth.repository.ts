import { supabase } from '../../../database/supabaseClient';
import { SignIn } from '../schemas/sign-in.schema';
import { DocumentOrEmail, SignUp } from '../schemas/sign-up.schema';
import { Table, Column, AccountStatus } from '../../../constants/database.constants';
import { AppError } from '../../../errors/AppError';
import { HttpStatus } from '../../../constants/api.constants';

export const findUser = async (itemToSearch: SignIn) => {
  const { data: authData, error: authError } = await supabase
    .from(Table.AUTH)
    .select(`${Column.USER_ID}, ${Column.PASSWORD_HASH}`)
    .eq(Column.PROVIDER, itemToSearch.provider)
    .eq(Column.PROVIDER_UID, itemToSearch.providerUid)
    .maybeSingle();

  if (authError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!authData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

  const userID = authData[Column.USER_ID];

  const { data: userData, error: userError } = await supabase
    .from(Table.USERS)
    .select(`${Column.TYPE}, ${Column.STATUS}`)
    .eq(Column.UUID, userID)
    .maybeSingle();

  if (userError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!userData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

  return {
    user_id: authData.user_id,
    password_hash: authData.password_hash,
    type: userData.type,
    status: userData.status,
  };
};

export const findRegisteredUser = async (
  value: DocumentOrEmail['value'],
  field: DocumentOrEmail['field'],
) => {
  const { data: userData, error: userError } = await supabase
    .from(Table.USERS)
    .select('*')
    .eq(field, value);

  if (userError)
    throw new AppError('Erro ao pesquisar cadastro.', HttpStatus.INTERNAL_SERVER_ERROR);
  if (!userData) throw new AppError('Usuário não encontrado.', HttpStatus.NOT_FOUND);

  return userData;
};

export const create = async (userData: SignUp): Promise<string> => {
  try {
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

    const userID = newUser.uuid;

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

    const { data: newProfile, error: profileInsertError } = await supabase
      .from(Table.PROFILES)
      .insert({
        user_id: userID,
        name: userData.name,
        country: userData.country,
        state: userData.state,
        city: userData.city,
        neighborhood: userData.neighborhood,
        street: userData.street,
        number: userData.number,
        zipcode: userData.zipcode,
      })
      .select();

    if (profileInsertError)
      throw new AppError('Erro ao cadastrar no profile.', HttpStatus.INTERNAL_SERVER_ERROR);
    return newProfile[0].userID;
  } catch (error) {
    //SOFT DELETE
    console.log(error);
    throw new Error('Erro ao cadastrar no auth.');
  }
};
