import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { generateToken } from './generateToken';
import { supabase } from '../src/database/supabaseClient';

describe('Testar edit profile', () => {
  it('Deve retornar 200 OK com os dados cadastrais do usuário', async () => {
    const { token } = await generateToken();

    const response = await request(app)
      .get('/profile')
      .set('Cookie', [`auth=${token}`]);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message.authUser.email).toBeDefined();
  });

  it('Deve retornar 400 devido a nao existir o id ou type', async () => {
    const token = jwt.sign({ id: '1231234', type: 'company' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });
    const response = await request(app)
      .get('/profile')
      .set('Cookie', [`auth=${token}`]);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Erro ao pesquisar usuário.');
  });

  it('Deve retornar 200 OK sem corpo', async () => {
    const { authUser, dataUser, token } = await generateToken();
    const data = { ...authUser, ...dataUser };
    console.log(data);
    const response = await request(app)
      .patch('/profile')
      .set('Cookie', [`auth=${token}`])
      .send(data);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toContain('');
  });

  it('Deve retornar 400 devido a informações incorretas ou faltando', async () => {
    const { authUser, dataUser, token } = await generateToken();
    delete dataUser.name;
    const data = { ...authUser, ...dataUser };
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
      document: '22345678912125',
      country: 'Brasil',
      state: 'Santa Catarina',
      city: 'Criciuma',
      neighborhood: 'Centro',
      street: 'Rua zero',
      number: '1',
      zipcode: '00000-000',
      password: 'asdvadasdA@1',
    });
    const { data: authUser, error: authError } = await supabase
      .from('auth')
      .select('id, email, document')
      .eq('document', '22345678912125')
      .single();

    if (authError) throw new Error('Erro ao pesquisar usuário.');

    const { data: dataUser, error: dataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    const token = jwt.sign(
      { id: authUser.id, type: dataUser.type },
      process.env.JWT_SECRET as string,
      {
        expiresIn: 5 * 60,
      }
    );
    const response = await request(app)
      .delete('/profile')
      .set('Cookie', [`auth=${token}`])
      .send({ id: authUser.id, type: dataUser.type });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toContain('');
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
      .from('auth')
      .select('id, *')
      .eq('document', '32345678912123')
      .single();
    const token = jwt.sign({ id: '1234', type: 'company' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });
    const response = await request(app)
      .delete('/profile')
      .set('Cookie', [`auth=${token}`]);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Erro ao excluir o usuário.');
  });
});
