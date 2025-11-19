import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User, Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      include: { salesRep: true },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password as string, saltRounds);
    
    const userData = {
      ...data,
      password: hashedPassword,
    };

    if (data.role === Role.SalesRep) {
      return this.prisma.user.create({
        data: {
          ...userData,
          salesRep: {
            create: {
              name: data.username as string,
            },
          },
        },
        include: { salesRep: true },
      });
    }

    return this.prisma.user.create({
      data: userData,
      include: { salesRep: true },
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        salesRep: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSalesReps() {
    return this.prisma.user.findMany({
      where: { role: Role.SalesRep },
      include: {
        salesRep: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput): Promise<User> {
    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password as string, saltRounds);
    }
    return this.prisma.user.update({
      where,
      data,
      include: { salesRep: true },
    });
  }
}

