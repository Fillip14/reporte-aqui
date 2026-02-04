import { supabase } from '../../../database/supabaseClient';
import { BUCKET, PROFILE_PREFIX } from '../../../constants/database.constants';

const getPublicImageUrl = (path: string) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Erro ao obter a URL pública da imagem.');
  return data.publicUrl;
};

const findImageFile = async (userID: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(PROFILE_PREFIX, { limit: 1, search: userID });

  if (error) throw new Error(`Erro ao listar arquivos: ${error.message}`);

  return data && data.length > 0 ? data[0] : undefined;
};

export const uploadImage = async (file: Express.Multer.File, userID: string) => {
  const existing = await findImageFile(userID);

  if (existing) await deleteImage(userID);

  const pathImage = `${PROFILE_PREFIX}/${userID}.${file.mimetype.split('/')[1]}`;

  const { data: pressignedData, error: pressignedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(pathImage);

  if (pressignedError) throw new Error(`Erro ao criar URL de upload: ${pressignedError.message}`);

  // return pressignedData;

  // FRONTEND DAQUI PARA BAIXO
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(pathImage, pressignedData.token, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
    });

  if (uploadError) throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  if (!uploadData) throw new Error('Upload falhou sem retornar dados.');

  const imageUrl = getPublicImageUrl(uploadData.path);

  return imageUrl;
};

export const downloadImage = async (userID: string) => {
  const file = await findImageFile(userID);

  if (file) {
    const pathImage = `${PROFILE_PREFIX}/${file.name}`;

    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(pathImage, 60);

    if (downloadError) throw new Error(`URL pressigned error: ${downloadError.message}`);
    if (!downloadData) throw new Error('URL pressigned não retornou dados.');

    console.log(downloadData);

    return downloadData;
  }

  throw new Error('Imagem não encontrada no bucket.');
};

export const deleteImage = async (userID: string) => {
  const file = await findImageFile(userID);

  if (file) {
    const pathImage = `${PROFILE_PREFIX}/${file.name}`;
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove([pathImage]);

    if (deleteError) throw new Error(`Erro ao deletar arquivo: ${deleteError.message}`);

    return true;
  }

  throw new Error('Imagem não encontrada no bucket.');
};
