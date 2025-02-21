import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { generateToken } from './generateToken';
import { supabase } from '../src/database/supabaseClient';

describe('Testar edit profile', () => {
  it('Deve retornar 200 OK com os dados cadastrais do usuário', async () => {
    const { data, token } = await generateToken();

    const response = await request(app)
      .get('/profile')
      .set('Cookie', [`auth=${token}`]);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message.email).toBeDefined();
  });

  it('Deve retornar 400 devido a nao existir o id ou type', async () => {
    const token = jwt.sign({ id: '1231234', type: 'company' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .get('/profile')
      .set('Cookie', [`auth=${token}`]);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('ID ou Type do usuario faltando ou incorreto.');
  });

  it('Deve retornar 200 OK sem corpo', async () => {
    const { data, token } = await generateToken();
    delete data.password;
    delete data.email;

    const response = await request(app)
      .patch('/profile')
      .set('Cookie', [`auth=${token}`])
      .send(data);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toContain('');
  });

  it('Deve retornar 400 devido a informações incorretas ou faltando', async () => {
    const { data, token } = await generateToken();
    delete data.password;
    delete data.email;
    delete data.id;

    const response = await request(app)
      .patch('/profile')
      .set('Cookie', [`auth=${token}`])
      .send(data);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Informações incorretas ou faltando.');
  });

  it('Deve retornar 200 OK sem corpo', async () => {
    await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany2@teste.com',
      name: 'Compania teste',
      document: '22345678912123',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });
    const { data, error } = await supabase
      .from('users')
      .select('id, *')
      .eq('email', 'testecompany2@teste.com')
      .single();

    const token = jwt.sign({ id: data.id, type: data.type }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .delete('/profile')
      .set('Cookie', [`auth=${token}`])
      .send({ id: data.id, type: data.type });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toContain('');
  });

  it('Deve retornar 400 devido ao ID faltando', async () => {
    await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany3@teste.com',
      name: 'Compania teste',
      document: '32345678912123',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });
    const { data, error } = await supabase
      .from('users')
      .select('id, *')
      .eq('document', '32345678912123')
      .single();

    const token = jwt.sign({ id: data.id, type: data.type }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .delete('/profile')
      .set('Cookie', [`auth=${token}`])
      .send({ type: data.type });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Informações incorretas ou faltando.');
  });

  it('Deve retornar 400 devido ao ID não existir', async () => {
    await request(app).post('/signup').send({
      type: 'company',
      email: 'testecompany4@teste.com',
      name: 'Compania teste',
      document: '32345678912123',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });
    const { data, error } = await supabase
      .from('users')
      .select('id, *')
      .eq('document', '32345678912123')
      .single();

    const token = jwt.sign({ id: data.id, type: data.type }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .delete('/profile')
      .set('Cookie', [`auth=${token}`])
      .send({ id: '1234', type: data.type });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Erro ao excluir o usuário.');
  });
});
