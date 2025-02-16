import { supabase } from '../../../database/supabaseClient';
import { Company, Client } from '../schemas/signup-schema';

export const userDoesNotExist = async (
  userData: Client | Company
): Promise<Client | Company> => {
  const { data, error } = await supabase
    .from(userData.type)
    .select('*')
    .eq('email', userData.email)
    .single();

  return data;
};

export const create = async (userData: Client | Company): Promise<string> => {
  const { type, ...userDataWithoutType } = userData;

  const { data: newUser, error: insertError } = await supabase
    .from(userData.type)
    .insert([userDataWithoutType])
    .select();

  if (insertError) throw new Error(`Erro ao cadastrar. ${userData.type}`);

  return newUser[0].name;
};
