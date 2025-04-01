import express, { Request, Response } from 'express';
import { uploadImageService } from '../services/upload-image.service';
import { HttpStatus } from '../../../constants/api.constants';
import logger from '../../../utils/log/logger';

export const uploadImageController = async (req: Request, res: Response) => {
  try {
    const type = req.params.type;
    const file = req.file as Express.Multer.File;
    const user = res.locals.user;

    if (!file || !type) {
      logger.error(`Arquivo ou type faltando. ${file}, ${type}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Não foi possivel realizar o upload.' });
      return;
    }

    const imageUrl = await uploadImageService(type, file, user.uuid);

    logger.info(`Upload realizado com sucesso!. ${imageUrl}`);
    res.status(HttpStatus.OK).json({
      message: 'Upload realizado com sucesso!',
      imageUrl,
    });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};
