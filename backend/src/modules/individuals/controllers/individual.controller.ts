import { HttpStatus } from '../../../constants/api.constants';
import { listReportsService, reportService } from '../services/individual-service';
import express, { Request, Response } from 'express';
import { reportSchema } from '../schemas/individual.schema';
import logger from '../../../utils/log/logger';

export const registerReport = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const user = res.locals.user;
    const dataReport = reportSchema.safeParse(req.body);

    if (!dataReport.success) {
      logger.error(`Erro ao realizar report. ${dataReport.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: dataReport.error });
      return;
    }

    const report = await reportService(files, dataReport.data, user.uuid);

    logger.info(`Report criado com sucesso!`);
    res.status(HttpStatus.OK).json({ message: 'Report criado com sucesso!' });
  } catch (error: any) {
    logger.error(`Erro ao criar report. ${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

export const listReports = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const listReports = await listReportsService(user.uuid);

    logger.info(`Reports listados com sucesso!`);
    res.status(HttpStatus.OK).json({ message: 'Reports listados com sucesso!', listReports });
  } catch (error: any) {
    logger.error(`Erro ao listar reports. ${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
