import express, { Request, Response } from 'express';
import {
  deleteImageService,
  downloadImageService,
  uploadImageService,
} from '../services/image-profile.service';
import { HttpStatus } from '../../../constants/api.constants';
import logger from '../../../utils/log/logger';

export const uploadImageController = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;
    const user = res.locals.user;

    if (!file) {
      logger.error(`Imagem faltando. ${file}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Erro ao realizar upload.' });
      return;
    }

    const pressignedUploadURL = await uploadImageService(file, user.userID);

    logger.info(`URL pressigned obtida. ${pressignedUploadURL}`);
    res.status(HttpStatus.OK).json({ message: 'URL pressigned obtida!', pressignedUploadURL });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

export const downloadImageController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;

    const pressignedDowloadURL = await downloadImageService(user.userID);

    logger.info(`URL download obtida. ${pressignedDowloadURL}`);
    res.status(HttpStatus.OK).json({ message: 'URL download obtida.', pressignedDowloadURL });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

export const deleteImageController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;

    await deleteImageService(user.userID);

    logger.info('Arquivo deletado com sucesso!');
    res.status(HttpStatus.OK).json({ message: 'Arquivo deletado com sucesso!' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
