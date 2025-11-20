import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateRegionDto, CreateAreaDto, CreateDistributorDto, CreateTerritoryDto } from './dto/taxonomy.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerAdminDto } from './dto/update-retailer-admin.dto';
import {
  RegionQueryDto,
  AreaQueryDto,
  DistributorQueryDto,
  TerritoryQueryDto,
} from 'src/retailers/dto/retailer-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('regions')
  @ApiOperation({ summary: 'Get all regions' })
  getRegions(@Query() query: RegionQueryDto) {
    return this.adminService.getRegions(query);
  }

  @Post('regions')
  @ApiOperation({ summary: 'Create region' })
  createRegion(@Body() dto: CreateRegionDto) {
    return this.adminService.createRegion(dto);
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Update region' })
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateRegionDto) {
    return this.adminService.updateRegion(id, dto);
  }

  @Delete('regions/:id')
  @ApiOperation({ summary: 'Delete region' })
  deleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRegion(id);
  }

  @Get('areas')
  @ApiOperation({ summary: 'Get all areas' })
  getAreas(@Query() query: AreaQueryDto) {
    return this.adminService.getAreas(query);
  }

  @Post('areas')
  @ApiOperation({ summary: 'Create area' })
  createArea(@Body() dto: CreateAreaDto) {
    return this.adminService.createArea(dto);
  }

  @Patch('areas/:id')
  @ApiOperation({ summary: 'Update area' })
  updateArea(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAreaDto) {
    return this.adminService.updateArea(id, dto);
  }

  @Delete('areas/:id')
  @ApiOperation({ summary: 'Delete area' })
  deleteArea(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteArea(id);
  }

  @Get('distributors')
  @ApiOperation({ summary: 'Get all distributors' })
  getDistributors(@Query() query: DistributorQueryDto) {
    return this.adminService.getDistributors(query);
  }

  @Post('distributors')
  @ApiOperation({ summary: 'Create distributor' })
  createDistributor(@Body() dto: CreateDistributorDto) {
    return this.adminService.createDistributor(dto);
  }

  @Patch('distributors/:id')
  @ApiOperation({ summary: 'Update distributor' })
  updateDistributor(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateDistributorDto) {
    return this.adminService.updateDistributor(id, dto);
  }

  @Delete('distributors/:id')
  @ApiOperation({ summary: 'Delete distributor' })
  deleteDistributor(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDistributor(id);
  }

  @Get('territories')
  @ApiOperation({ summary: 'Get all territories' })
  getTerritories(@Query() query: TerritoryQueryDto) {
    return this.adminService.getTerritories(query);
  }

  @Post('territories')
  @ApiOperation({ summary: 'Create territory' })
  createTerritory(@Body() dto: CreateTerritoryDto) {
    return this.adminService.createTerritory(dto);
  }

  @Patch('territories/:id')
  @ApiOperation({ summary: 'Update territory' })
  updateTerritory(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTerritoryDto) {
    return this.adminService.updateTerritory(id, dto);
  }

  @Delete('territories/:id')
  @ApiOperation({ summary: 'Delete territory' })
  deleteTerritory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTerritory(id);
  }

  @Get('sales-reps')
  @ApiOperation({ summary: 'Get all sales reps' })
  getSalesReps(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.adminService.getSalesReps(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search
    );
  }

  // Bulk assignments
  @Post('assignments/bulk')
  @ApiOperation({ summary: 'Bulk assign/unassign retailers to SR' })
  bulkAssign(@Body() dto: BulkAssignDto) {
    return this.adminService.bulkAssign(dto);
  }

  // Retailers CRUD
  @Get('retailers')
  @ApiOperation({ summary: 'Get all retailers (paginated)' })
  async getRetailers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getRetailers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
    });
  }

  @Get('retailers/:id')
  @ApiOperation({ summary: 'Get retailer by ID' })
  async getRetailer(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getRetailer(id);
  }

  @Post('retailers')
  @ApiOperation({ summary: 'Create retailer' })
  async createRetailer(@Body() dto: CreateRetailerDto) {
    return this.adminService.createRetailer(dto);
  }

  @Patch('retailers/:id')
  @ApiOperation({ summary: 'Update retailer' })
  async updateRetailer(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRetailerAdminDto) {
    return this.adminService.updateRetailer(id, dto);
  }

  @Delete('retailers/:id')
  @ApiOperation({ summary: 'Delete retailer' })
  async deleteRetailer(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteRetailer(id);
    return { success: true };
  }

  // CSV import
  @Post('retailers/import')
  @ApiOperation({ summary: 'Import retailers from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importRetailers(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('Only CSV files are allowed');
    }
    return this.adminService.importRetailers(file.buffer);
  }
}

