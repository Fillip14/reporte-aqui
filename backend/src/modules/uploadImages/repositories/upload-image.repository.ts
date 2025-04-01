import { supabase } from '../../../database/supabaseClient';

const getPublicImageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(`reporte-aqui/${bucket}`).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Erro ao obter a URL pública da imagem.');
  return data.publicUrl;
};

export const uploadImage = async (type: string, file: Express.Multer.File, uuid: string) => {
  const bucketName = `${type}-images`;
  const fileName = `${uuid}.${file.mimetype.split('/')[1]}`;

  const { data: listData, error: listError } = await supabase.storage.from('reporte-aqui').list();

  if (!listData || listData.length === 0 || listError)
    throw new Error(`Erro ao listar buckets: ${listError?.message}`);

  const bucketExists = listData?.some((item) => item.name === bucketName);

  if (!bucketExists) throw new Error(`Bucket não encontrado: ${bucketName}`);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(`reporte-aqui/${bucketName}`)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  if (!uploadData) throw new Error('Upload falhou sem retornar dados.');

  const imageUrl = getPublicImageUrl(bucketName, uploadData.path);

  return imageUrl;
};
