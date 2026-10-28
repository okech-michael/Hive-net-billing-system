import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'hivenet' },
    update: {},
    create: { name: 'HiveNet', slug: 'hivenet' },
  });
  const site = await prisma.site.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Main site' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Main site', address: 'Configure your site address' },
  });
  const definitions = [
    ['1 hour', 500, 3600], ['2 hours', 1000, 7200], ['4 hours', 1500, 14400],
    ['6 hours', 2000, 21600], ['24 hours', 3500, 86400], ['1 week', 17000, 604800], ['1 month', 50000, 2592000],
  ] as const;
  for (const [name, priceMinor, durationSeconds] of definitions) {
    const existing = await prisma.internetPackage.findFirst({ where: { tenantId: tenant.id, siteId: null, name } });
    if (!existing) await prisma.internetPackage.create({ data: { tenantId: tenant.id, name, priceMinor, durationSeconds } });
  }
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { tenantId: tenant.id, email: email.toLowerCase(), name: 'HiveNet Administrator', role: 'TENANT_ADMIN', passwordHash: await argon2.hash(password) },
    });
  } else {
    console.info('SEED_ADMIN_EMAIL/PASSWORD not set; no sign-in user was created.');
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
