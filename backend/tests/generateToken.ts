import { supabase } from '../src/database/supabaseClient';
import jwt from 'jsonwebtoken';

export const generateToken = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, *')
      .eq('email', 'testecompany@teste.com')
      .single();

    const token = jwt.sign({ id: data.id, type: data.type }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });
    return { data, token };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};
