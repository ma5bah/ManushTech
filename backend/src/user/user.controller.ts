import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Delete,
  Param,
  ParseIntPipe,
  Get,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User as CurrentUser } from 'src/auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService) { }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getUsers(@CurrentUser() currentUser: User) {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: User) {
    const predefinedAdminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const isPredefinedAdmin = currentUser.email === predefinedAdminEmail;

    if (!isPredefinedAdmin && createUserDto.role !== Role.SalesRep) {
      throw new ForbiddenException('Only the predefined admin can create Admin users.');
    }

    let user = await this.userService.createUser(createUserDto);
    delete (user as any).password;
    return { message: 'User created successfully', user };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateDto: CreateUserDto, @CurrentUser() currentUser: User) {
    const userToUpdate = await this.userService.findOne({ id });
    if (!userToUpdate) {
      throw new ForbiddenException('User not found.');
    }

    const predefinedAdminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const isPredefinedAdmin = currentUser.email === predefinedAdminEmail;

    if (userToUpdate.email === predefinedAdminEmail && !isPredefinedAdmin) {
      throw new ForbiddenException('Only the predefined admin can update themselves.');
    }

    if (!isPredefinedAdmin) {
      if (userToUpdate.role !== Role.SalesRep) {
        throw new ForbiddenException('Admins can only update SalesRep users.');
      }
      if (updateDto.role !== Role.SalesRep) {
        throw new ForbiddenException('Admins can only set role to SalesRep.');
      }
    }

    return this.userService.updateUser({ id }, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: User) {
    const userToDelete = await this.userService.findOne({ id });
    const predefinedAdminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const isPredefinedAdmin = currentUser.email === predefinedAdminEmail;

    if (!userToDelete) {
      throw new ForbiddenException('User not found.');
    }

    if (userToDelete.email === predefinedAdminEmail) {
      throw new ForbiddenException('Cannot delete the predefined admin.');
    }

    if (!isPredefinedAdmin && userToDelete.role !== Role.SalesRep) {
      throw new ForbiddenException('Only the predefined admin can delete Admin users.');
    }

    return this.userService.deleteUser({ id });
  }
}

