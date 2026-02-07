import { HttpStatus } from '../../../constants/api.constants';
import express, { Request, Response } from 'express';
import { checkDocService } from '../services/check-doc.service';
import logger from '../../../utils/log/logger';

export const checkDocController = async (req: Request, res: Response) => {
  const { document } = req.body;
  const result = await checkDocService(document);

  logger.info(`Documento verificado com sucesso: ${document}`);
  res
    .status(HttpStatus.OK)
    .json({
      exists: result.exists,
      status: result.status,
      suggestedAction: result.suggestedAction,
    });
  return;
};
