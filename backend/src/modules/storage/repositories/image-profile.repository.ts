import { supabase } from '../../../database/supabaseClient';

const getPublicImageUrl = (path: string): string => {
  const { data } = supabase.storage.from(`reporte-aqui/profile-images`).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Erro ao obter a URL pública da imagem.');
  return data.publicUrl;
};

export const uploadImage = async (file: Express.Multer.File, uuid: string) => {
  const fileName = `${uuid}.${file.mimetype.split('/')[1]}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(`reporte-aqui/profile-images`)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  if (!uploadData) throw new Error('Upload falhou sem retornar dados.');

  const imageUrl = getPublicImageUrl(uploadData.path);

  return imageUrl;
};

export const deleteImage = async (uuid: string) => {
  const { data: imagesList, error: imageListError } = await supabase.storage
    .from(`reporte-aqui`)
    .list(`profile-images`);

  if (!imagesList || imagesList.length === 0 || imageListError)
    throw new Error(`Erro ao listar arquivos: ${imageListError}`);

  const imagesInBucket = imagesList.map((item) => item.name);

  const findImage = imagesInBucket.find((name) => name.includes(uuid));

  if (!findImage) throw new Error(`Arquivo não encontrado.`);

  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(`reporte-aqui`)
    .remove([`profile-images/${findImage}`]);

  if (deleteError) throw new Error(`Erro ao deletar arquivo: ${deleteError.message}`);

  return true;
};
