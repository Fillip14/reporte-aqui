import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

describe('Testar logout', () => {
  it('Deve retornar Sessão encerrada com sucesso.', async () => {
    const token = jwt.sign({ id: 21312312, type: 'individual' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .post('/api/logout')
      .set('Cookie', [`auth=${token}`]);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.message).toBe('Sessão encerrada com sucesso.');
  });

  it('Deve retornar Sessão nao encontrada.', async () => {
    const response = await request(app).post('/api/logout');

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.error).toBe('Sessão não encontrada.');
  });
});
