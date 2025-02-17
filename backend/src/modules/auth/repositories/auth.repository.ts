import { supabase } from '../../../database/supabaseClient';
import { SignUp } from '../schemas/sign-up.schema';

export const findUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

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
