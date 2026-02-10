// import { supabase } from '../../../database/supabaseClient';
// import { Column, Table } from '../../../constants/database.constants';
// import { AppError } from '../../../errors/AppError';
// import { HttpStatus } from '../../../constants/api.constants';
// import { SignUp } from '../../auth/schemas/sign-up.schema';

// export const findProfile = async (field: string, value: string) => {
//   const { data: profileData, error: profileError } = await supabase
//     .from(Table.PROFILES)
//     .select('*')
//     .eq(field, value)
//     .maybeSingle();

//   if (profileError)
//     throw new AppError('Erro ao pesquisar usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
//   return profileData;
// };

// export const patchProfile = async (userData: object, user_id: string) => {
//   const { error: profileError } = await supabase
//     .from(Table.PROFILES)
//     .update(userData)
//     .eq(Column.USER_ID, user_id);

//   if (profileError)
//     throw new AppError('Erro ao atualizar perfil do usuário.', HttpStatus.INTERNAL_SERVER_ERROR);
//   return;
// };

// export const deleteProfile = async (userID: string) => {
//   const { error: profileError } = await supabase
//     .from(Table.PROFILES)
//     .delete()
//     .eq(Column.USER_ID, userID);

//   if (profileError)
//     throw new AppError('Erro ao excluir profile.', HttpStatus.BAD_REQUEST, {
//       success: false,
//       suggestedAction: 'delete again',
//     });
//   return;
// };

// export const createNewProfile = async (userID: string, userData: SignUp) => {
//   const { data: newProfile, error: profileInsertError } = await supabase
//     .from(Table.PROFILES)
//     .insert({
//       user_id: userID,
//       name: userData.name,
//       country: userData.country,
//       state: userData.state,
//       city: userData.city,
//       neighborhood: userData.neighborhood,
//       street: userData.street,
//       number: userData.number,
//       zipcode: userData.zipcode,
//     })
//     .select();

//   if (profileInsertError)
//     throw new AppError('Erro ao cadastrar no profile.', HttpStatus.INTERNAL_SERVER_ERROR);
// };
