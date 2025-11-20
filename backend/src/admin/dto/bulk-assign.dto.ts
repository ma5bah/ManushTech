import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, IsIn } from 'class-validator';

export class BulkAssignDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  salesRepId: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  @IsInt({ each: true })
  retailerIds: number[];

  @ApiProperty({ example: 'assign', enum: ['assign', 'unassign'] })
  @IsIn(['assign', 'unassign'])
  action: 'assign' | 'unassign';
}

