import express, { Request, Response } from 'express';
import { userService, companyService } from '../services/registerServices';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.register(req.body);
    res.status(201).json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const company = await companyService.register(req.body);
    res.status(201).json({ company });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
