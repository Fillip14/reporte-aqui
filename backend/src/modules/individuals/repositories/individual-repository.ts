import { supabase } from '../../../database/supabaseClient';
import { Report } from '../schemas/individual-schema';

export const create = async (dataReport: Report, userId: string) => {
  const { data: newReport, error: reportError } = await supabase
    .from('reports')
    .insert({
      uuid: userId,
      title: dataReport.title,
      description: dataReport.description,
      vinculedCompany: dataReport.vinculedCompany,
    })
    .select();

  if (reportError) throw new Error('Erro ao cadastrar report.');

  return true;
};

export const listReports = async (userId: string) => {
  const { data: reportsData, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('uuid', userId);

  if (reportsError) throw new Error('Erro ao listar reports.');

  return reportsData;
};
