import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const adminUsername = process.env.SUPERADMIN_USERNAME || 'admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      name: 'Admin User',
      password: hashedPassword,
    },
  });

  console.log('Created admin:', admin.email);
  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

