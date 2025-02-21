import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';

describe('Testar signup', () => {
  it('Deve retornar cadastro com sucesso para individual', async () => {
    const response = await request(app).post('/signup').send({
      type: 'individual',
      email: 'testeindividual1234@teste.com',
      name: 'dashidjoa',
      document: '12345680170',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.message).toBe('Cadastro realizado com sucesso.');
  });

  it('Deve retornar cadastro com sucesso para company', async () => {
    const response = await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany1234@teste.com',
      name: 'dashidjoa',
      document: '12345678912120',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.message).toBe('Cadastro realizado com sucesso.');
  });

  it('Deve retornar erro no cadastro por falta de informação', async () => {
    const response = await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany@teste.com',
      name: 'dashidjoa',
      document: '12345678912121',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      // password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Informações incorretas ou faltando.');
  });

  it('Deve retornar cadastro ja existe por ser mesmo document', async () => {
    const response = await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany@teste.com',
      name: 'dashidjoa',
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

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Usuário já cadastrado.');
  });

  it('Deve retornar cadastro ja existe por ser mesmo email', async () => {
    const response = await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany@teste.com',
      name: 'dashidjoa',
      document: '12345678912122',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Email já cadastrado.');
  });

  it('Deve retornar cadastro ja existe por document ja estar cadastrado.', async () => {
    const response = await request(app).post('/signup').send({
      document: '12345678912123',
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Usuário já cadastrado.');
  });
});
