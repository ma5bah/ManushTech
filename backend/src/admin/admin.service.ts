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
import { User, Role, Prisma } from '@prisma/client';

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
      // Check if any retailer is already assigned using queryRaw for JOIN
      const alreadyAssigned: any[] = await this.prisma.$queryRaw`
        SELECT R.id, R.name, SR.id as "salesRep_id", SR.name as "salesRep_name"
        FROM "Retailer" R
        LEFT JOIN "SalesRep" SR ON R."salesRepId" = SR.id
        WHERE R.id = ANY(${retailerIds}) AND R."salesRepId" IS NOT NULL
      `;

      if (alreadyAssigned.length > 0) {
        const conflicts = alreadyAssigned.map(
          (r) => `Retailer "${r.name}" (ID: ${r.id}) is already assigned to ${r.salesRep_name}`,
        );
        throw new BadRequestException(
          `Cannot assign retailers. The following conflicts exist:\n${conflicts.join('\n')}`,
        );
      }

      // Simple batch update - use Prisma ORM
      await this.prisma.$executeRaw`
        UPDATE "Retailer"
        SET "salesRepId" = ${salesRepId}
        WHERE id = ANY(${retailerIds})
      `;
    } else {
      // Simple batch update - use Prisma ORM
      await this.prisma.$executeRaw`
        UPDATE "Retailer"
        SET "salesRepId" = NULL
        WHERE id = ANY(${retailerIds}) AND "salesRepId" = ${salesRepId}
      `;
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
    // console.log('Parsed records:', records);
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

    // Filter out duplicates by phone number to prevent errors
    const phones = newRetailers.map(r => r.phone).filter(p => p !== null) as string[];
    let existingPhones: string[] = [];
    
    if (phones.length > 0) {
      const existing = await this.prisma.retailer.findMany({
        where: { phone: { in: phones } },
        select: { phone: true },
      });
      existingPhones = existing.map(r => r.phone!).filter(p => p !== null);
    }

    const existingPhoneSet = new Set(existingPhones);
    const uniqueRetailers = newRetailers.filter(r => !r.phone || !existingPhoneSet.has(r.phone));
    
    if (uniqueRetailers.length === 0) {
       return { 
         imported: 0, 
         skipped: records.length, 
         message: 'All retailers were skipped (duplicates or invalid data).' 
       };
    }

    // Use Prisma createMany for safe batch insert
    await this.prisma.retailer.createMany({
      data: uniqueRetailers,
      skipDuplicates: true,
    });

    return {
      imported: uniqueRetailers.length,
      skipped: records.length - uniqueRetailers.length,
    };
  }

  // Retailers CRUD
  async getRetailers(query: RetailerQueryDto) {
    const { page = 1, limit = 20, search, regionId, areaId, distributorId, territoryId } = query;
    const skip = (page - 1) * limit;

    // Build dynamic WHERE conditions using Prisma.sql
    const conditions: Prisma.Sql[] = [];
    
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(Prisma.sql`(R.name ILIKE ${searchPattern} OR R.phone ILIKE ${searchPattern})`);
    }
    if (regionId) {
      conditions.push(Prisma.sql`R."regionId" = ${regionId}`);
    }
    if (areaId) {
      conditions.push(Prisma.sql`R."areaId" = ${areaId}`);
    }
    if (distributorId) {
      conditions.push(Prisma.sql`R."distributorId" = ${distributorId}`);
    }
    if (territoryId) {
      conditions.push(Prisma.sql`R."territoryId" = ${territoryId}`);
    }

    const whereClause = conditions.length > 0 
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.sql``;

    const retailers: any[] = await this.prisma.$queryRaw`
      SELECT 
        R.id,
        R.name,
        R.phone,
        R."regionId",
        R."areaId", 
        R."distributorId",
        R."territoryId",
        R."salesRepId",
        R.points,
        R.routes,
        R.notes,
        R."createdAt",
        R."updatedAt",
        Reg.id as "region_id",
        Reg.name as "region_name",
        A.id as "area_id",
        A.name as "area_name",
        D.id as "distributor_id",
        D.name as "distributor_name",
        T.id as "territory_id",
        T.name as "territory_name",
        SR.id as "salesRep_id",
        SR.name as "salesRep_name"
      FROM "Retailer" R
      LEFT JOIN "Region" Reg ON R."regionId" = Reg.id
      LEFT JOIN "Area" A ON R."areaId" = A.id
      LEFT JOIN "Distributor" D ON R."distributorId" = D.id
      LEFT JOIN "Territory" T ON R."territoryId" = T.id
      LEFT JOIN "SalesRep" SR ON R."salesRepId" = SR.id
      ${whereClause}
      ORDER BY R.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult: any[] = await this.prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Retailer" R
      ${whereClause}
    `;

    const total = countResult[0]?.count || 0;

    // Transform flat results to nested structure
    const transformedRetailers = retailers.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      regionId: r.regionId,
      areaId: r.areaId,
      distributorId: r.distributorId,
      territoryId: r.territoryId,
      salesRepId: r.salesRepId,
      points: r.points,
      routes: r.routes,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      region: { id: r.region_id, name: r.region_name },
      area: { id: r.area_id, name: r.area_name },
      distributor: { id: r.distributor_id, name: r.distributor_name },
      territory: r.territory_id ? { id: r.territory_id, name: r.territory_name } : null,
      salesRep: r.salesRep_id ? { id: r.salesRep_id, name: r.salesRep_name } : null,
    }));

    return {
      data: transformedRetailers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRetailer(id: number) {
    const result: any[] = await this.prisma.$queryRaw`
      SELECT 
        R.id,
        R.name,
        R.phone,
        R."regionId",
        R."areaId", 
        R."distributorId",
        R."territoryId",
        R."salesRepId",
        R.points,
        R.routes,
        R.notes,
        R."createdAt",
        R."updatedAt",
        Reg.id as "region_id",
        Reg.name as "region_name",
        A.id as "area_id",
        A.name as "area_name",
        D.id as "distributor_id",
        D.name as "distributor_name",
        T.id as "territory_id",
        T.name as "territory_name",
        SR.id as "salesRep_id",
        SR.name as "salesRep_name"
      FROM "Retailer" R
      LEFT JOIN "Region" Reg ON R."regionId" = Reg.id
      LEFT JOIN "Area" A ON R."areaId" = A.id
      LEFT JOIN "Distributor" D ON R."distributorId" = D.id
      LEFT JOIN "Territory" T ON R."territoryId" = T.id
      LEFT JOIN "SalesRep" SR ON R."salesRepId" = SR.id
      WHERE R.id = ${id}
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException(`Retailer with ID ${id} not found`);
    }

    const r = result[0];
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      regionId: r.regionId,
      areaId: r.areaId,
      distributorId: r.distributorId,
      territoryId: r.territoryId,
      salesRepId: r.salesRepId,
      points: r.points,
      routes: r.routes,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      region: { id: r.region_id, name: r.region_name },
      area: { id: r.area_id, name: r.area_name },
      distributor: { id: r.distributor_id, name: r.distributor_name },
      territory: r.territory_id ? { id: r.territory_id, name: r.territory_name } : null,
      salesRep: r.salesRep_id ? { id: r.salesRep_id, name: r.salesRep_name } : null,
    };
  }

  async createRetailer(dto: CreateRetailerDto) {
    // Simple create - use Prisma ORM (types will work after migration)
    const created: any = await this.prisma.retailer.create({
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
    });

    return this.getRetailer(created.id);
  }

  async updateRetailer(id: number, dto: UpdateRetailerAdminDto) {
    // Simple update - use Prisma ORM (types will work after migration)
    const updated: any = await this.prisma.retailer.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache for assigned sales rep
    if (updated.salesRepId) {
      await this.redis.delPattern(`retailers:sr:${updated.salesRepId}:*`);
    }

    return this.getRetailer(id);
  }

  async deleteRetailer(id: number) {
    await this.prisma.retailer.delete({ where: { id } });
    await this.redis.delPattern('retailers:*');
    await this.redis.delPattern('retailers:sr:*');
  }
}

