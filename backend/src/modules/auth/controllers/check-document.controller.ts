import { HttpStatus } from '../../../constants/api.constants';
import { signUpSchema } from '../schemas/sign-up.schema';
import { registerUserService, findUserService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';
import { AccountStatus } from '../../../constants/database.constants';
import { sendRes } from '../../../http/sendRes';

export const checkDocumentController = async (req: Request, res: Response) => {
  try {
    const { document } = req.body;

    if (!document) return sendRes(res, HttpStatus.BAD_REQUEST, 'Documento não informado.');

    const userData = await findUserService(document, 'document');

    if (!userData || userData.length === 0) {
      return sendRes(res, HttpStatus.OK, {
        exists: false,
      });
    }

    const status = userData[0].status;

    switch (status) {
      case AccountStatus.ACTIVE:
        return sendRes(res, HttpStatus.OK, {
          exists: true,
          status,
          suggestedAction: 'login',
        });

      case AccountStatus.PENDING:
      case AccountStatus.SUSPENDED:
        return sendRes(res, HttpStatus.OK, {
          exists: true,
          status,
          suggestedAction: 'contact_support',
        });

      case AccountStatus.DELETED:
        return sendRes(res, HttpStatus.OK, {
          exists: true,
          status,
          suggestedAction: 'reactivate',
        });
    }
  } catch (error: any) {
    return sendRes(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
