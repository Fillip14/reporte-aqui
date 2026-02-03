import { create, listReports } from '../repositories/individual.repository';
import { Report } from '../schemas/individual.schema';

export const reportService = async (
  files: Express.Multer.File[],
  dataReport: Report,
  userId: string,
) => {
  return await create(files, dataReport, userId);
};

export const listReportsService = async (userId: string) => {
  return await listReports(userId);
};
