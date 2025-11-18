import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const adminUsername = process.env.SUPERADMIN_USERNAME || 'admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      phone: '0000000000',
      password: hashedPassword,
      role: Role.Admin,
    },
  });

  console.log('Created admin:', user.email);
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

