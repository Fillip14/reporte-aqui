import { Company } from '../../schemas/company-schema';
import { create, findByCnpj } from '../models/company-model';

const checkCompanyDoesNotExist = async (cnpj: Company['cnpj']) => {
  const existingCompany = await findByCnpj(cnpj);

  if (existingCompany) throw new Error('Empresa já existe.');
};

export const companyService = {
  async register(companyData: Company) {
    await checkCompanyDoesNotExist(companyData.cnpj);

    return create(companyData);
  },
};
