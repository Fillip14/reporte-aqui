import { supabase } from '../database/supabase';

export const UserService = {
  async register(
    email: string,
    name: string,
    cpf: string,
    country: string,
    state: string,
    city: string,
    neighborhood: string,
    street: string,
    number: string,
    zipcode: string,
    password: string
  ) {
    // Verifica se o usuário já existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Usuário já existe.');
    }

    // Insere o novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          cpf,
          country,
          state,
          city,
          neighborhood,
          street,
          number,
          zipcode,
          password,
        },
      ])
      .select();

    if (insertError) {
      throw new Error('Erro ao cadastrar usuário.');
    }
    return newUser[0].name;
  },
};

export const CompanyService = {
  async register(
    companyEmail: string,
    companyName: string,
    cnpj: string,
    country: string,
    state: string,
    city: string,
    neighborhood: string,
    street: string,
    number: string,
    zipcode: string,
    password: string
  ) {
    // Verifica se o usuário já existe
    const { data: existingCompany, error: findError } = await supabase
      .from('companies')
      .select('*')
      .eq('companyName', companyName)
      .single();

    if (existingCompany) {
      throw new Error('Empresa já existe.');
    }

    // Insere o novo usuário
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert([
        {
          companyEmail,
          companyName,
          cnpj,
          country,
          state,
          city,
          neighborhood,
          street,
          number,
          zipcode,
          password,
        },
      ])
      .select();

    if (insertError) {
      console.log(insertError);
      throw new Error('Erro ao cadastrar empresa.');
    }
    return newCompany[0].companyName;
  },
};
