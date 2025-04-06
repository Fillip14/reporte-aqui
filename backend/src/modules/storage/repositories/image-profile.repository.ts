import { supabase } from '../../../database/supabaseClient';

const getPublicImageUrl = (path: string) => {
  const { data } = supabase.storage.from(`reporte-aqui`).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Erro ao obter a URL pública da imagem.');
  return data.publicUrl;
};

const getImagesInBucket = async (uuid: string) => {
  const { data: imagesList, error: imageListError } = await supabase.storage
    .from(`reporte-aqui`)
    .list(`profile-images`);

  if (!imagesList || imagesList.length === 0 || imageListError)
    throw new Error(`Erro ao listar arquivos: ${imageListError}`);

  const imagesInBucket = imagesList.map((item) => item.name);

  const findImage = imagesInBucket.find((name) => name.includes(uuid));

  if (!findImage) throw new Error(`Arquivo não encontrado.`);

  return `profile-images/${findImage}`;
};

export const uploadImage = async (file: Express.Multer.File, uuid: string) => {
  const pathImage = `profile-images/${uuid}.${file.mimetype.split('/')[1]}`;

  const { data: pressignedData, error: pressignedError } = await supabase.storage
    .from('reporte-aqui')
    .createSignedUploadUrl(pathImage, { upsert: true });

  if (pressignedError) throw new Error(`Erro ao criar URL de upload: ${pressignedError.message}`);

  // return pressignedData;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(`reporte-aqui`)
    .uploadToSignedUrl(pathImage, pressignedData.token, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  if (!uploadData) throw new Error('Upload falhou sem retornar dados.');

  const imageUrl = getPublicImageUrl(uploadData.path);

  return imageUrl;
};

export const downloadImage = async (uuid: string) => {
  const findedImage = await getImagesInBucket(uuid);

  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('reporte-aqui')
    .createSignedUrl(findedImage, 60);

  if (downloadError) throw new Error(`URL pressigned error: ${downloadError.message}`);
  if (!downloadData) throw new Error('URL pressigned não retornou dados.');

  console.log(downloadData);

  return downloadData;
};

export const deleteImage = async (uuid: string) => {
  const findedImage = await getImagesInBucket(uuid);

  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(`reporte-aqui`)
    .remove([findedImage]);

  if (deleteError) throw new Error(`Erro ao deletar arquivo: ${deleteError.message}`);

  return true;
};
