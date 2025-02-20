import { app } from '../../src/server';
import request from 'supertest';

export default async () => {
  try {
    await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany@teste.com',
      name: 'Compania teste',
      document: '12345678912123',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });
    console.log('Cadastro de usuário de teste concluído.');
  } catch (error) {
    console.error('Erro durante o cadastro global:', error);
    throw error;
  }
};
