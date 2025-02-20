import { supabase } from '../../../database/supabaseClient';
import { UserType } from '../constants/profile.constants';
import { ProfileUpdate } from '../schemas/profile.schema';

export const findUserByID = async (user: { id: string; type: UserType }) => {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, name, email, type, country, state, city, neighborhood, street, number, zipcode, document'
    )
    .eq('id', user.id)
    .single();
  return data;
};

export const patchUser = async (user: ProfileUpdate) => {
  const { data, error } = await supabase
    .from('users')
    .update(user) // user.data contém os campos a serem alterados
    .eq('id', user.id); // Filtra pelo ID do usuário

  return { data, error };
};
