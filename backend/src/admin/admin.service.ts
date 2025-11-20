import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRegionDto, CreateAreaDto, CreateDistributorDto, CreateTerritoryDto } from './dto/taxonomy.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerAdminDto } from './dto/update-retailer-admin.dto';
import {
  RetailerQueryDto,
  RegionQueryDto,
  AreaQueryDto,
  DistributorQueryDto,
  TerritoryQueryDto,
} from '../retailers/dto/retailer-query.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Regions
  async createRegion(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: dto });
  }

  async updateRegion(id: number, dto: CreateRegionDto) {
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async deleteRegion(id: number) {
    return this.prisma.region.delete({ where: { id } });
  }

  async getRegions(query: RegionQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [regions, total] = await Promise.all([
      this.prisma.region.findMany({
        where,
        skip,
        take: limit,
        include: { areas: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.region.count({ where }),
    ]);

    return {
      data: regions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Areas
  async createArea(dto: CreateAreaDto) {
    return this.prisma.area.create({ data: dto });
  }

  async updateArea(id: number, dto: CreateAreaDto) {
    return this.prisma.area.update({ where: { id }, data: dto });
  }

  async deleteArea(id: number) {
    return this.prisma.area.delete({ where: { id } });
  }

  async getAreas(query: AreaQueryDto) {
    const { page = 1, limit = 20, search, regionId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (regionId) {
      where.regionId = regionId;
    }
    const [areas, total] = await Promise.all([
      this.prisma.area.findMany({
        where,
        skip,
        take: limit,
        include: { region: true, territories: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.area.count({ where }),
    ]);
    return {
      data: areas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Distributors
  async createDistributor(dto: CreateDistributorDto) {
    return this.prisma.distributor.create({ data: dto });
  }

  async updateDistributor(id: number, dto: CreateDistributorDto) {
    return this.prisma.distributor.update({ where: { id }, data: dto });
  }

  async deleteDistributor(id: number) {
    return this.prisma.distributor.delete({ where: { id } });
  }

  async getDistributors(query: DistributorQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [distributors, total] = await Promise.all([
      this.prisma.distributor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.distributor.count({ where }),
    ]);
    return {
      data: distributors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Territories
  async createTerritory(dto: CreateTerritoryDto) {
    return this.prisma.territory.create({ data: dto });
  }

  async updateTerritory(id: number, dto: CreateTerritoryDto) {
    return this.prisma.territory.update({ where: { id }, data: dto });
  }

  async deleteTerritory(id: number) {
    return this.prisma.territory.delete({ where: { id } });
  }

  async getTerritories(query: TerritoryQueryDto) {
    const { page = 1, limit = 20, search, areaId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (areaId) {
      where.areaId = areaId;
    }
    const [territories, total] = await Promise.all([
      this.prisma.territory.findMany({
        where,
        skip,
        take: limit,
        include: { area: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.territory.count({ where }),
    ]);
    return {
      data: territories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Sales Reps
  async getSalesReps(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { role: Role.SalesRep };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [salesReps, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, username: true, email: true, phone: true },
        orderBy: { username: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: salesReps,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Bulk assignment
  async bulkAssign(dto: BulkAssignDto) {
    const { salesRepId, retailerIds, action } = dto;

    if (action === 'assign') {
      const data = retailerIds.map((retailerId) => ({ salesRepId, retailerId }));
      await this.prisma.salesRepRetailer.createMany({
        data,
        skipDuplicates: true,
      });
    } else {
      await this.prisma.salesRepRetailer.deleteMany({
        where: {
          salesRepId,
          retailerId: { in: retailerIds },
        },
      });
    }

    await this.redis.delPattern(`retailers:sr:${salesRepId}:*`);
    return { success: true, affected: retailerIds.length };
  }

  // CSV import
  async importRetailers(csvBuffer: Buffer) {
    const csvContent = csvBuffer.toString();
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records.length) {
      throw new BadRequestException('CSV file is empty');
    }

    const requiredFields = ['name', 'region', 'area', 'distributor'];
    const firstRecord = records[0] as Record<string, unknown>;
    const missingFields = requiredFields.filter((field) => !Object.prototype.hasOwnProperty.call(firstRecord, field));
    if (missingFields.length > 0) {
      throw new BadRequestException(`Missing required CSV columns: ${missingFields.join(', ')}`);
    }

    // Fetch all necessary taxonomy data in one go to avoid N+1 queries
    const regions = await this.prisma.region.findMany();
    const areas = await this.prisma.area.findMany();
    const territories = await this.prisma.territory.findMany();
    const distributors = await this.prisma.distributor.findMany();

    const regionMap = new Map(regions.map(r => [r.name.toLowerCase(), r.id]));
    const areaMap = new Map(areas.map(a => [`${a.name.toLowerCase()}|${a.regionId}`, a.id]));
    const territoryMap = new Map(territories.map(t => [`${t.name.toLowerCase()}|${t.areaId}`, t.id]));
    const distributorMap = new Map(distributors.map(d => [d.name.toLowerCase(), d.id]));

    const newRetailers: any[] = [];
    for (const record of records) {
      const anyRecord = record as any;
      const regionId = regionMap.get(anyRecord.region?.toLowerCase());
      if (!regionId) {
        console.warn(`Skipping retailer "${anyRecord.name}": Region "${anyRecord.region}" not found.`);
        continue;
      }

      const areaId = areaMap.get(`${anyRecord.area?.toLowerCase()}|${regionId}`);
      if (!areaId) {
        console.warn(`Skipping retailer "${anyRecord.name}": Area "${anyRecord.area}" not found in region "${anyRecord.region}".`);
        continue;
      }
      
      let territoryId = null;
      if (anyRecord.territory && anyRecord.territory.trim() !== '') {
        territoryId = territoryMap.get(`${anyRecord.territory?.toLowerCase()}|${areaId}`);
        if (!territoryId) {
            console.warn(`Skipping retailer "${anyRecord.name}": Territory "${anyRecord.territory}" not found in area "${anyRecord.area}".`);
            continue;
        }
      }

      const distributorId = distributorMap.get(anyRecord.distributor?.toLowerCase());
      if (!distributorId) {
        console.warn(`Skipping retailer "${anyRecord.name}": Distributor "${anyRecord.distributor}" not found.`);
        continue;
      }

      newRetailers.push({
        name: anyRecord.name,
        phone: anyRecord.phone || null,
        regionId,
        areaId,
        distributorId,
        territoryId,
        points: anyRecord.points ? parseInt(anyRecord.points, 10) : 0,
        routes: anyRecord.routes || '',
        notes: anyRecord.notes || '',
      });
    }
    
    if (newRetailers.length === 0) {
        return { imported: 0, skipped: records.length, message: 'All retailers were skipped due to missing data.' };
    }

    const result = await this.prisma.retailer.createMany({
      data: newRetailers,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      skipped: records.length - result.count,
    };
  }

  // Retailers CRUD
  async getRetailers(query: RetailerQueryDto) {
    const { page = 1, limit = 20, search, regionId, areaId, distributorId, territoryId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (regionId) {
      where.regionId = regionId;
    }
    if (areaId) {
      where.areaId = areaId;
    }
    if (distributorId) {
      where.distributorId = distributorId;
    }
    if (territoryId) {
      where.territoryId = territoryId;
    }

    const [retailers, total] = await Promise.all([
      this.prisma.retailer.findMany({
        where,
        skip,
        take: limit,
        include: {
          region: { select: { id: true, name: true } },
          area: { select: { id: true, name: true } },
          distributor: { select: { id: true, name: true } },
          territory: { select: { id: true, name: true } },
          assignments: { include: { salesRep: { select: { id: true, name: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.retailer.count({ where }),
    ]);

    return {
      data: retailers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRetailer(id: number) {
    const retailer = await this.prisma.retailer.findUnique({
      where: { id },
      include: {
        region: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        assignments: { include: { salesRep: { select: { id: true, name: true } } } },
      },
    });

    if (!retailer) {
      throw new NotFoundException(`Retailer with ID ${id} not found`);
    }

    return retailer;
  }

  async createRetailer(dto: CreateRetailerDto) {
    return this.prisma.retailer.create({
      data: {
        name: dto.name,
        phone: dto.phone || null,
        regionId: dto.regionId,
        areaId: dto.areaId,
        distributorId: dto.distributorId,
        territoryId: dto.territoryId || null,
        points: dto.points || 0,
        routes: dto.routes || '',
        notes: dto.notes || '',
      },
      include: {
        region: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        assignments: { include: { salesRep: { select: { id: true, name: true } } } },
      },
    });
  }

  async updateRetailer(id: number, dto: UpdateRetailerAdminDto) {
    const updated = await this.prisma.retailer.update({
      where: { id },
      data: dto,
      include: {
        region: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        assignments: { include: { salesRep: { select: { id: true, name: true } } } },
      },
    });

    // Invalidate cache for all assigned sales reps
    for (const assignment of updated.assignments) {
      await this.redis.delPattern(`retailers:sr:${assignment.salesRep.id}:*`);
    }

    return updated;
  }

  async deleteRetailer(id: number) {
    await this.prisma.retailer.delete({ where: { id } });
    await this.redis.delPattern('retailers:*');
    await this.redis.delPattern('retailers:sr:*');
  }
}

