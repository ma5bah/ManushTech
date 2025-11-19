import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { RetailersModule } from './retailers/retailers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    AuthModule,
    AdminModule,
    RetailersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
