import { supabase } from '../../../database/supabaseClient';
import { SignIn } from '../schemas/sign-in.schema';
import { SignUp } from '../schemas/sign-up.schema';

export const findUserByEmail = async (email: string): Promise<SignIn> => {
  const { data, error } = await supabase.from('users').select('id, *').eq('email', email).single();

  return data;
};

export const create = async (userData: SignUp): Promise<string> => {
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert(userData)
    .select();

  if (insertError) throw new Error(`Ocorreu um erro interno.`);

  return newUser[0].name;
};
