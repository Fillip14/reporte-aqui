import { supabase } from '../database/supabase';

export const UserService = {
  async register(username: string, password: string) {
    // Verifica se o usuário já existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Usuário já existe.');
    }

    // Insere o novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ username, password }])
      .select();

    if (insertError) {
      throw new Error('Erro ao cadastrar usuário.');
    }
    return newUser[0].username;
  },
};
