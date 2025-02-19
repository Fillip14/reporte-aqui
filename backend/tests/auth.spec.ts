import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

describe('Testar auth', () => {
  it('Deve retornar "Usuário autorizado" quando o token for válido', async () => {
    const token = jwt.sign({ id: 21312312, type: 'individual' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .get('/teste')
      .set('Cookie', [`auth=${token}`]);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toBe('Usuário autorizado');
  });

  it('Deve retornar "Usuário autorizado" quando o token for válido', async () => {
    const token = jwt.sign({ id: 21312312, type: 'individual' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .get('/teste')
      .set('Cookie', [`auth=${token}`]); // Define o cookie "auth" com o token gerado

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toBe('Usuário autorizado');
  });

  it('Deve retornar "Usuário não autorizado" por falta de token', async () => {
    const response = await request(app).get('/teste');

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe('Não autorizado.');
  });

  it('Deve retornar "Usuário não autorizado" quando o token não for válido', async () => {
    const token = jwt.sign({ id: 21312312, type: 'tt' }, process.env.JWT_SECRET as string, {
      expiresIn: 5 * 60,
    });

    const response = await request(app)
      .get('/teste')
      .set('Cookie', [`auth=${token}`]); // Define o cookie "auth" com o token gerado

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.error).toBe('Não autorizado.');
  });
});
