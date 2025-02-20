import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { generateToken } from './generateToken';

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
});
