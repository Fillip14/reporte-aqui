import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from './prisma.js';
import { resetDb } from '../../tests/helpers/resetDb.js';

describe('prisma client', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates and finds a user', async () => {
    const created = await prisma.user.create({
      data: {
        email: 'smoke@example.com',
        passwordHash: 'dummy-hash',
        role: 'individual',
      },
    });

    const found = await prisma.user.findUnique({ where: { id: created.id } });
    expect(found?.email).toBe('smoke@example.com');
  });
});
