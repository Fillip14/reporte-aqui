import express, { Request, Response } from 'express';
import { companyService } from '../services/company-service';
import { HttpStatus } from '../../../constants/api.constants';
import { companySchema } from '../schemas/company-schema';

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const companyData = companySchema.safeParse(req.body);

    if (!companyData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: companyData.error });
      return;
    }
    const company = await companyService.register(req.body);
    res.status(HttpStatus.CREATED).json({ company });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
