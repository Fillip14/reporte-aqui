import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { listCompanies } from './companies';

describe('companies api', () => {
  it('listCompanies fetches the approved companies list', async () => {
    server.use(
      http.get('/api/companies', () => HttpResponse.json([{ id: 'c1', companyName: 'Empresa X' }])),
    );

    const companies = await listCompanies();
    expect(companies).toEqual([{ id: 'c1', companyName: 'Empresa X' }]);
  });
});
