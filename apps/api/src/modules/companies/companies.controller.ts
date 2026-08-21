import type { Request, Response } from 'express';
import * as companiesService from './companies.service.js';

export async function listCompanies(_req: Request, res: Response) {
  const companies = await companiesService.listApprovedCompanies();
  return res.status(200).json(companies);
}
