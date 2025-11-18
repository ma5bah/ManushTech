import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createPredefinedAdmin();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async createPredefinedAdmin() {
    try {
      const adminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('SUPERADMIN_PASSWORD');

      if (!adminEmail || !adminPassword) {
        Logger.warn(
          'SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not found in .env file. Skipping predefined admin creation.',
        );
        return;
      }

      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        Logger.log(`Predefined Admin with email: ${adminEmail} already exists.`);
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await this.prisma.user.create({
        data: {
          username: 'admin',
          phone: '0000000000',
          email: adminEmail,
          password: hashedPassword,
          role: Role.Admin,
        },
      });

      Logger.log(`Predefined Admin with email: ${adminEmail} created successfully.`);
    } catch (error) {
      Logger.error('Error creating predefined admin:', error);
      process.exit(1);
    }
  }
}
