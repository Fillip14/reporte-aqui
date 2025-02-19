import { supabase } from '../../../database/supabaseClient';
import { User } from '../schemas/individual-schema';

export const findByEmail = async (email: User['email']): Promise<User> => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  return data;
};

export const create = async (userData: User): Promise<string> => {
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([userData])
    .select();

  if (insertError) throw new Error('Erro ao cadastrar usuário.');

  return newUser[0].name;
};
