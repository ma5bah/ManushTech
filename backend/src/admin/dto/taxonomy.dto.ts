import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Dhaka Division' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateAreaDto {
  @ApiProperty({ example: 'Dhaka North' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  regionId: number;
}

export class CreateDistributorDto {
  @ApiProperty({ example: 'Metro Distributors Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateTerritoryDto {
  @ApiProperty({ example: 'Gulshan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  areaId: number;
}

