import { create, listReports } from '../repositories/individual-repository';
import { Report } from '../schemas/individual-schema';

export const reportService = async (dataReport: Report, userId: string) => {
  return await create(dataReport, userId);
};

export const listReportsService = async (userId: string) => {
  return await listReports(userId);
};
