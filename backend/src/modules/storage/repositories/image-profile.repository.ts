import { supabase } from '../../../database/supabaseClient';

const BUCKET = 'reporte-aqui';
const PROFILE_PREFIX = 'profile-images';

const getPublicImageUrl = (path: string) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Erro ao obter a URL pública da imagem.');
  return data.publicUrl;
};

const findImageFile = async (uuid: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(PROFILE_PREFIX, { limit: 1, search: uuid });

  if (error) throw new Error(`Erro ao listar arquivos: ${error.message}`);

  return data && data.length > 0 ? data[0] : undefined;
};

export const uploadImage = async (file: Express.Multer.File, uuid: string) => {
  const existing = await findImageFile(uuid);

  if (existing) await deleteImage(uuid);

  const pathImage = `${PROFILE_PREFIX}/${uuid}.${file.mimetype.split('/')[1]}`;

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

export const downloadImage = async (uuid: string) => {
  const file = await findImageFile(uuid);

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

export const deleteImage = async (uuid: string) => {
  const file = await findImageFile(uuid);

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
