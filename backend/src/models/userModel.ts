import { supabase } from '../database/supabaseClient';

export const finduserbyEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return data;
};

export const creatnewUser = async (userData: any) => {
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([userData])
    .select();

  if (insertError) {
    throw new Error('Erro ao cadastrar usuário.');
  }
  return newUser[0].name;
};
