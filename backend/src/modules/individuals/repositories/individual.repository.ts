import { supabase } from '../../../database/supabaseClient';
import { Report } from '../schemas/individual.schema';
import mime from 'mime-types';

export const create = async (files: Express.Multer.File[], dataReport: Report, userId: string) => {
  const { data: newReport, error: reportError } = await supabase
    .from('reports')
    .insert({
      uuid: userId,
      title: dataReport.title,
      description: dataReport.description,
      company: dataReport.company,
    })
    .select();

  if (reportError) throw new Error(`Erro ao criar report: ${reportError.message}`);
  if (!newReport) throw new Error('Erro ao cadastrar report.');

  const report = newReport[0];
  const signedUrls = [];
  const allowedExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'odt',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'mp4',
    'mov',
    'avi',
    'wmv',
    'mkv',
    'webm',
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const extension = mime.extension(file.mimetype) as string;
    const filePath = `post-docs/${userId}/${report.id}/doc${i + 1}.${extension}`;

    if (!allowedExtensions.includes(extension))
      throw new Error(`Tipo de arquivo não permitido: .${extension}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('reporte-aqui')
      .createSignedUploadUrl(filePath, { upsert: true });

    if (signedUrlError) throw new Error(`Erro ao criar URL de upload: ${signedUrlError.message}`);
    if (!signedUrlData) throw new Error('Erro ao criar URL de upload.');

    // modificar para o frontend depois
    signedUrls.push({
      file: file,
      path: filePath,
      token: signedUrlData.token,
      url: signedUrlData.signedUrl,
    });
  }

  // return signedUrls;

  // FRONTEND DAQUI PARA BAIXO
  if (files && signedUrls.length > 0) {
    for (let i = 0; i < signedUrls.length; i++) {
      const docField = `doc${i + 1}`;
      const textField = `textDoc${i + 1}`;

      const path = signedUrls[i].path;
      const token = signedUrls[i].token;
      const file = signedUrls[i].file;
      const type = signedUrls[i].file.mimetype;

      const textValue = dataReport[`textDoc${i + 1}` as keyof typeof dataReport];

      const { data: updateDocsData, error: updateDocsError } = await supabase
        .from('reports')
        .update({
          [docField]: path,
          [textField]: textValue,
        })
        .eq('id', report.id);

      if (updateDocsError)
        throw new Error(`Erro ao fazer update dos dados do DOC: ${updateDocsError.message}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(`reporte-aqui`)
        .uploadToSignedUrl(path, token, file.buffer, {
          contentType: type,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw new Error(`Erro ao fazer upload do DOC: ${uploadError.message}`);
      if (!uploadData) throw new Error('Erro ao fazer upload do DOC.');
    }
  }
  return true;
};

export const listReports = async (userId: string) => {
  const { data: reportsData, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('uuid', userId);

  if (reportsError) throw new Error(`Erro ao listar report: ${reportsError.message}`);
  if (!reportsData) throw new Error('Erro ao listar reports.');

  return reportsData;
};
