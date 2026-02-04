import { supabase } from '../../../database/supabaseClient';
import { SignIn } from '../schemas/sign-in.schema';
import { SignUp } from '../schemas/sign-up.schema';
import {
  BUCKET,
  TABLE_AUTH,
  TABLE_USERS,
  COLUMN_USER_ID,
  TABLE_REPORTS,
  COLUMN_ID_REPORTS,
} from '../../../constants/database.constants';

export const findAuthUser = async (itemToSearch: SignIn) => {
  const { data: authUser, error: findError } = await supabase
    .from(TABLE_AUTH)
    .select(`${COLUMN_USER_ID}, password`)
    .or(`document.eq.${itemToSearch.document},email.eq.${itemToSearch.email}`)
    .single();

  if (findError) throw new Error('Erro ao pesquisar cadastro.');

  const userID = authUser[COLUMN_USER_ID];

  const { data: dataUser, error: userError } = await supabase
    .from(TABLE_USERS)
    .select('type')
    .eq(COLUMN_USER_ID, userID)
    .single();

  if (userError) throw new Error('Erro ao pesquisar cadastro.');

  return { authUser, dataUser };
};

export const findRegisteredUser = async (itemToSearch: SignUp['document'] | SignUp['email']) => {
  const { count, error } = await supabase
    .from(TABLE_AUTH)
    .select('*', { count: 'exact', head: true })
    .or(`document.eq.${itemToSearch},email.eq.${itemToSearch}`);

  if (error) throw new Error(`Erro ao verificar ${document}.`);

  return (count ?? 0) > 0;
};

export const create = async (userData: SignUp): Promise<string> => {
  const { data: newAuthUser, error: authInsertError } = await supabase
    .from(TABLE_AUTH)
    .insert({ email: userData.email, password: userData.password, document: userData.document })
    .select(COLUMN_USER_ID);

  if (authInsertError) throw new Error('Erro ao cadastrar.');

  const userID = newAuthUser[0][COLUMN_USER_ID]; // Pega o id da tabela auth

  const { data: newUser, error: userInsertError } = await supabase
    .from(TABLE_USERS)
    .insert({
      userID: userID, // Chave estrangeira da tabela auth
      type: userData.type,
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

  if (userInsertError) throw new Error('Erro ao cadastrar.');

  return newUser[0].name;
};
