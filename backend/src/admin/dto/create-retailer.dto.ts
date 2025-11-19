import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRetailerDto {
  @ApiProperty({ example: 'Retailer Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  regionId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  areaId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  distributorId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  territoryId?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ example: 'Route 1' })
  @IsString()
  @IsOptional()
  routes?: string;

  @ApiPropertyOptional({ example: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

