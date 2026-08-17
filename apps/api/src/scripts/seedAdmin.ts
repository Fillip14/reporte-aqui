import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

export async function seedAdmin(email: string, password: string): Promise<{ created: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { created: false };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, passwordHash, role: 'admin' } });
  return { created: true };
}

async function runFromCli() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
  }

  const result = await seedAdmin(email, password);
  console.log(result.created ? `Admin user created: ${email}` : 'Admin already exists, skipping.');
  await prisma.$disconnect();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFromCli().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
}
