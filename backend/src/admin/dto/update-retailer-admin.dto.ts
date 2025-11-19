import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRetailerAdminDto {
  @ApiPropertyOptional({ example: 'Retailer Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  regionId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  areaId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  distributorId?: number;

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

