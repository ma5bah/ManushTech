import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min } from 'class-validator';

export class UpdateRetailerDto {
  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ example: 'Route 5' })
  @IsOptional()
  @IsString()
  routes?: string;

  @ApiPropertyOptional({ example: 'High value customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

