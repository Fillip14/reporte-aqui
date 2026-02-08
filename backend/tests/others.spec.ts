import { HttpStatus } from '../src/constants/api.constants';
import { app } from '../src/server';
import request from 'supertest';

describe('Testar app routes', () => {
  it('Deve retornar 200 OK homepage', async () => {
    const response = await request(app).get('/api/');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.text).toBe('Homepage');
  });
});
