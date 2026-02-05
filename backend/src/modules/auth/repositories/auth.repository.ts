import { supabase } from '../../../database/supabaseClient';
import { SignIn } from '../schemas/sign-in.schema';
import { DocumentOrEmail, SignUp } from '../schemas/sign-up.schema';
import {
  TABLE_AUTH,
  TABLE_USERS,
  TABLE_PROFILES,
  COLUMN_USER_ID,
  COLUMN_UUID,
} from '../../../constants/database.constants';

export const findUser = async (itemToSearch: SignIn) => {
  const { data: authUser, error: findError } = await supabase
    .from(TABLE_AUTH)
    .select(`${COLUMN_USER_ID}, password_hash`)
    .eq('provider', itemToSearch.provider)
    .eq('provider_uid', itemToSearch.providerUid)
    .single();

  if (findError) throw new Error('Erro ao pesquisar cadastro.');

  const userID = authUser[COLUMN_USER_ID];

  const { data: dataUser, error: userError } = await supabase
    .from(TABLE_USERS)
    .select('type')
    .eq(COLUMN_UUID, userID)
    .single();

  if (userError) throw new Error('Erro ao pesquisar cadastro.');

  return { authUser, dataUser };
};

export const findRegisteredUser = async (
  value: DocumentOrEmail['value'],
  field: DocumentOrEmail['field'],
) => {
  const { count, error } = await supabase
    .from(TABLE_USERS)
    .select('*', { count: 'exact', head: true })
    .eq(field, value);

  if (error) throw new Error(`Erro ao verificar ${field}.`);

  return (count ?? 0) > 0;
};

export const create = async (userData: SignUp): Promise<string> => {
  const status = 'active';
  const { data: newUser, error: userInsertError } = await supabase
    .from(TABLE_USERS)
    .insert({
      type: userData.type,
      status: status,
      email: userData.email,
      document: userData.document,
    })
    .select(COLUMN_UUID)
    .single();

  if (userInsertError) throw new Error('Erro ao cadastrar no users.');

  const userID = newUser.uuid;

  const { data: newAuthUser, error: authInsertError } = await supabase
    .from(TABLE_AUTH)
    .insert({
      user_id: userID,
      provider: userData.provider,
      provider_uid: userData.providerUid,
      password_hash: userData.password,
    })
    .select();

  if (authInsertError) throw new Error('Erro ao cadastrar no auth.');

  const { data: newProfile, error: profileInsertError } = await supabase
    .from(TABLE_PROFILES)
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

  return newProfile[0].name;
};
