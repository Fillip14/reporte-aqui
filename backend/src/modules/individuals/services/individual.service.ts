import { create, listReports } from '../repositories/individual.repository';
import { Report } from '../schemas/individual.schema';

export const reportService = async (
  files: Express.Multer.File[],
  dataReport: Report,
  userID: string,
) => {
  return await create(files, dataReport, userID);
};

export const listReportsService = async (userID: string) => {
  return await listReports(userID);
};
