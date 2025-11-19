import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RetailersService } from './retailers.service';
import { RetailerQueryDto } from './dto/retailer-query.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Controller('retailers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Retailers')
@ApiBearerAuth()
@Roles(Role.SalesRep, Role.Admin)
export class RetailersController {
  constructor(private retailersService: RetailersService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of all retailers' })
  async findAll(@Req() req: any, @Query() query: RetailerQueryDto) {
    return this.retailersService.findAllAssigned(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get retailer details by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.retailersService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update allowed retailer fields' })
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateRetailerDto) {
    return this.retailersService.update(req.user.id, id, updateDto);
  }
}

