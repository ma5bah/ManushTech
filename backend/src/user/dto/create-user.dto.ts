import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';


export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

