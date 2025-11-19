import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';
import { Role } from '@prisma/client';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly userService: UserService,
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

      const existingAdmin = await this.userService.findOne({
        email: adminEmail,
      });

      if (existingAdmin) {
        Logger.log(`Predefined Admin with email: ${adminEmail} already exists.`);
        return;
      }

      await this.userService.createUser({
        username: 'admin',
        phone: '0000000000',
        email: adminEmail,
        password: adminPassword,
        role: Role.Admin,
      });

      Logger.log(`Predefined Admin with email: ${adminEmail} created successfully.`);
    } catch (error) {
      Logger.error('Error creating predefined admin:', error);
      process.exit(1);
    }
  }
}
