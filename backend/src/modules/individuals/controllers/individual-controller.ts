import { HttpStatus } from '../../../constants/api.constants';
import { listReportsService, reportService } from '../services/individual-service';
import express, { Request, Response } from 'express';
import { reportSchema } from '../schemas/individual-schema';

export const registerReport = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const dataReport = reportSchema.safeParse(req.body);

    if (!dataReport.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: dataReport.error });
      return;
    }

    const report = await reportService(dataReport.data, user.uuid);

    res.status(HttpStatus.CREATED).json({ report });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

export const listReports = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const listReports = await listReportsService(user.uuid);
    res.status(HttpStatus.OK).json({ listReports });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
