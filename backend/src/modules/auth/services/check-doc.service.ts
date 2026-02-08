import { HttpStatus } from '../../../constants/api.constants';
import { AccountStatus } from '../../../constants/database.constants';
import { findRegisteredUser } from '../repositories/auth.repository';
import { AppError } from '../../../errors/AppError';

export const checkDocService = async (document: string) => {
  if (!document) throw new AppError('Documento não informado.', HttpStatus.BAD_REQUEST);

  const userData = await findRegisteredUser(document, 'document');

  if (!userData || userData.length > 0) {
    const status = userData[0].status;

    switch (status) {
      case AccountStatus.ACTIVE:
        return {
          exists: true,
          status,
          suggestedAction: 'login',
        };

      case AccountStatus.PENDING:
      case AccountStatus.SUSPENDED:
        return {
          exists: true,
          status,
          suggestedAction: 'contact_support',
        };
    }
  }
  return {
    exists: false,
    status: '',
    suggestedAction: 'create_account',
  };
};
