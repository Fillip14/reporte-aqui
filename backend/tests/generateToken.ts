import { supabase } from '../src/database/supabaseClient';
import jwt from 'jsonwebtoken';

export const generateToken = async () => {
  try {
    const { data: authUser, error: authError } = await supabase
      .from('auth')
      .select('uuid, email, document')
      .eq('document', '12345678912123')
      .single();

    if (authError) throw new Error('Erro ao pesquisar usuário.');

    const { data: dataUser, error: dataError } = await supabase
      .from('users')
      .select('*')
      .eq('uuid', authUser.uuid)
      .single();

    const token = jwt.sign(
      { uuid: authUser.uuid, type: dataUser.type },
      process.env.JWT_SECRET as string,
      {
        expiresIn: 5 * 60,
      }
    );
    return { authUser, dataUser, token };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};
