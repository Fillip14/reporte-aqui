import { supabase } from '../../../database/supabaseClient';
import { Company } from '../../schemas/company-schema';

export const findByCnpj = async (cnpj: Company['cnpj']): Promise<Company> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('cnpj', cnpj)
    .single();
  return data;
};

export const create = async (companyData: Company): Promise<string> => {
  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert([companyData])
    .select();

  if (insertError) {
    console.log(insertError);
    throw new Error('Erro ao cadastrar empresa.');
  }
  return newCompany[0].companyName;
};
