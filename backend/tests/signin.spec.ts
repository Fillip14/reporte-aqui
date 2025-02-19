import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';

beforeAll(async () => {
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
    number: 1,
    zipcode: '00000-000',
    password: 'asdvadasdA@1',
  });
});

describe('Testar signin', () => {
  it('Deve retornar login com sucesso para company', async () => {
    const response = await request(app).post('/signin').send({
      id: '12',
      type: 'company',
      email: 'testecompany@teste.com',
      password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message).toContain('Login realizado com sucesso.');
  });

  it('Deve retornar email ou senha incorreto ou faltando por falta de senha', async () => {
    const response = await request(app).post('/signin').send({
      id: '12',
      type: 'company',
      email: 'testecompany@teste.com',
      // password: 'asdvadasdA@1',
    });
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe('Email ou senha inválidos.');
  });

  it('Deve retornar email ou senha incorreto ou faltando por email nao existente', async () => {
    const response = await request(app).post('/signin').send({
      id: '12',
      type: 'company',
      email: 'naoexiste@naoexiste.com',
      password: 'asdvadasdA@1',
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe('Email ou senha inválidos.');
  });

  it('Deve retornar email ou senha incorreto por senha estar incorreta', async () => {
    const response = await request(app).post('/signin').send({
      id: '12',
      type: 'company',
      email: 'testecompany@teste.com',
      password: 'asdvadasdA@',
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe('Email ou senha inválidos.');
  });
});
