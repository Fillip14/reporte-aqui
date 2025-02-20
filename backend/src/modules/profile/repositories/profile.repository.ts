import { supabase } from '../../../database/supabaseClient';
import { ProfileData, ProfileUpdate } from '../schemas/profile.schema';

export const findUserByID = async (user: ProfileData) => {
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
  const { data, error } = await supabase.from('users').update(user).eq('id', user.id);

  return { data, error };
};

export const deleteUser = async (user: ProfileData) => {
  const { data, error } = await supabase.from('users').delete().eq('id', user.id).single();

  return { data, error };
};
