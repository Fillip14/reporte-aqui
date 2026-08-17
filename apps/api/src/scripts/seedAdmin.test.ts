import { describe, it, expect, beforeEach } from 'vitest';
import { seedAdmin } from './seedAdmin.js';
import { resetDb } from '../../tests/helpers/resetDb.js';
import { prisma } from '../lib/prisma.js';

describe('seedAdmin', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates an admin user', async () => {
    const result = await seedAdmin('admin@example.com', 'super-secret-admin-1');
    expect(result.created).toBe(true);

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
    expect(admin.role).toBe('admin');
  });

  it('is idempotent when the admin already exists', async () => {
    await seedAdmin('admin@example.com', 'super-secret-admin-1');
    const result = await seedAdmin('admin@example.com', 'a-different-password');
    expect(result.created).toBe(false);

    const count = await prisma.user.count({ where: { email: 'admin@example.com' } });
    expect(count).toBe(1);
  });
});
