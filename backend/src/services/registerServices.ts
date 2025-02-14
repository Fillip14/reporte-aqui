import { finduserbyEmail, creatnewUser } from '../models/userModel';
import { findcompanybyName, creatnewCompany } from '../models/companyModel';

export const userService = {
  async register(userData: any) {
    const existingUser = await finduserbyEmail(userData.email);

    if (existingUser) {
      throw new Error('Usuário já existe.');
    }

    return creatnewUser(userData);
  },
};

export const companyService = {
  async register(companyData: any) {
    const existingCompany = await findcompanybyName(companyData.companyName);

    if (existingCompany) {
      throw new Error('Empresa já existe.');
    }

    return creatnewCompany(companyData);
  },
};
