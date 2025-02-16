import { supabase } from '../../../database/supabaseClient';
import { Company, Client } from '../schemas/signup-schema';

export const userDoesNotExist = async (
  userData: Client | Company,
  tableType: string
): Promise<Client | Company> => {
  const { data, error } = await supabase
    .from(tableType)
    .select('*')
    .eq('email', userData.email)
    .single();

  return data;
};

export const create = async (
  userData: Client | Company,
  tableType: string
): Promise<string> => {
  const { data: newUser, error: insertError } = await supabase
    .from(tableType)
    .insert([userData])
    .select();

  if (insertError) throw new Error(`Erro ao cadastrar. ${tableType}`);

  return newUser[0].name;
};
