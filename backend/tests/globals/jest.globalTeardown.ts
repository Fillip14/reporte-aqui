import { supabase } from '../../src/database/supabaseClient';

export default async () => {
  try {
    const emails = [
      'testecompany@teste.com',
      'testecompany2@teste.com',
      'testeindividual1234@teste.com',
      'testecompany1234@teste.com',
    ];

    const { error } = await supabase.from('users').delete().in('email', emails);

    if (error) {
      console.error('Erro durante a exclusão global:', error);
      throw error;
    }

    console.log('✅ Exclusão de usuários de teste concluída.');
  } catch (error) {
    console.error('Erro inesperado durante a exclusão global:', error);
    throw error;
  }
};
