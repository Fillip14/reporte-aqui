import { supabase } from '../../../database/supabaseClient';
import { SignIn } from '../schemas/sign-in.schema';
import { DocumentOrEmail, SignUp } from '../schemas/sign-up.schema';
import { Table, Column, AccountStatus } from '../../../constants/database.constants';

export const findUser = async (itemToSearch: SignIn) => {
  const { data: authUser, error: findError } = await supabase
    .from(Table.AUTH)
    .select(`${Column.USER_ID}, password_hash`)
    .eq(Column.PROVIDER, itemToSearch.provider)
    .eq(Column.PROVIDER_UID, itemToSearch.providerUid)
    .single();

  if (findError) throw new Error('Erro ao pesquisar cadastro.');

  const userID = authUser[Column.USER_ID];

  const { data: dataUser, error: userError } = await supabase
    .from(Table.USERS)
    .select('type')
    .eq(Column.UUID, userID)
    .single();

  if (userError) throw new Error('Erro ao pesquisar cadastro.');

  return { user_id: authUser.user_id, password_hash: authUser.password_hash, type: dataUser.type };
};

export const findRegisteredUser = async (
  value: DocumentOrEmail['value'],
  field: DocumentOrEmail['field'],
) => {
  const { data: usersData, error: usersError } = await supabase
    .from(Table.USERS)
    .select('*')
    .eq(field, value);

  if (usersError) throw new Error(`Erro ao verificar ${field}.`);

  return usersData;
};

export const create = async (userData: SignUp, existingUserId?: string): Promise<string> => {
  let userID: string;
  try {
    if (existingUserId) {
      const { error: updateUserError } = await supabase
        .from(Table.USERS)
        .update({
          type: userData.type,
          status: AccountStatus.ACTIVE,
          email: userData.email,
          document: userData.document,
        })
        .eq(Column.UUID, existingUserId);

      if (updateUserError) {
        throw new Error('Erro ao restaurar usuário.');
      }

      userID = existingUserId;
    } else {
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

      if (userInsertError) throw new Error('Erro ao cadastrar no users.');

      userID = newUser.uuid;
    }

    const { error: authInsertError } = await supabase
      .from(Table.AUTH)
      .insert({
        user_id: userID,
        provider: userData.provider,
        provider_uid: userData.providerUid,
        password_hash: userData.password,
      })
      .select();

    if (authInsertError) throw new Error('Erro ao cadastrar no auth.');

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

    if (profileInsertError) throw new Error('Erro ao cadastrar no profile.');
    return newProfile[0].userID;
  } catch (error) {
    //SOFT DELETE
    console.log(error);
    throw new Error('Erro ao cadastrar no auth.');
  }
};
