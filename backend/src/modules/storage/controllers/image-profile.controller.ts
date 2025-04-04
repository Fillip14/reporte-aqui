import express, { Request, Response } from 'express';
import { deleteImageService, uploadImageService } from '../services/image-profile.service';
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

    const imageUrl = await uploadImageService(file, user.uuid);

    logger.info(`Upload realizado com sucesso!. ${imageUrl}`);
    res.status(HttpStatus.OK).json({ message: 'Upload realizado com sucesso!' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

export const deleteImageController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;

    await deleteImageService(user.uuid);

    logger.info('Arquivo deletado com sucesso!');
    res.status(HttpStatus.OK).json({ message: 'Arquivo deletado com sucesso!' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
