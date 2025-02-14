import { supabase } from '../database/supabaseClient';

export const findcompanybyName = async (companyName: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('companyName', companyName)
    .single();
  return data;
};

export const creatnewCompany = async (companyData: any) => {
  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert([companyData])
    .select();

  if (insertError) {
    throw new Error('Erro ao cadastrar empresa.');
  }
  return newCompany[0].companyName;
};
