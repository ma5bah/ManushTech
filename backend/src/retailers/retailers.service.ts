import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RetailerQueryDto } from './dto/retailer-query.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RetailersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAllAssigned(userId: number, query: RetailerQueryDto) {
    const { page = 1, limit = 20, search, regionId, areaId, distributorId, territoryId } = query;
    const skip = (page - 1) * limit;

    const cacheKey = `retailers:sr:${userId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build dynamic WHERE conditions using Prisma.sql
    const conditions: Prisma.Sql[] = [Prisma.sql`R."salesRepId" = ${userId}`];
    
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(Prisma.sql`(R.name ILIKE ${searchPattern} OR R.phone ILIKE ${searchPattern})`);
    }
    if (regionId) {
      conditions.push(Prisma.sql`R."regionId" = ${parseInt(regionId)}`);
    }
    if (areaId) {
      conditions.push(Prisma.sql`R."areaId" = ${parseInt(areaId)}`);
    }
    if (distributorId) {
      conditions.push(Prisma.sql`R."distributorId" = ${parseInt(distributorId)}`);
    }
    if (territoryId) {
      conditions.push(Prisma.sql`R."territoryId" = ${parseInt(territoryId)}`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

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
        Reg.name as "regionName",
        A.name as "areaName",
        D.name as "distributorName",
        T.name as "territoryName"
      FROM "Retailer" R
      LEFT JOIN "Region" Reg ON R."regionId" = Reg.id
      LEFT JOIN "Area" A ON R."areaId" = A.id
      LEFT JOIN "Distributor" D ON R."distributorId" = D.id
      LEFT JOIN "Territory" T ON R."territoryId" = T.id
      WHERE ${whereClause}
      ORDER BY R.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult: any[] = await this.prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Retailer" R
      WHERE ${whereClause}
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
      region: { name: r.regionName },
      area: { name: r.areaName },
      distributor: { name: r.distributorName },
      territory: r.territoryName ? { name: r.territoryName } : null,
    }));

    const result = {
      data: transformedRetailers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async findOne(userId: number, id: string) {
    const retailerId = parseInt(id);
    
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
        Reg.name as "regionName",
        A.name as "areaName",
        D.name as "distributorName",
        T.name as "territoryName"
      FROM "Retailer" R
      LEFT JOIN "Region" Reg ON R."regionId" = Reg.id
      LEFT JOIN "Area" A ON R."areaId" = A.id
      LEFT JOIN "Distributor" D ON R."distributorId" = D.id
      LEFT JOIN "Territory" T ON R."territoryId" = T.id
      WHERE R.id = ${retailerId}
    `;

    if (!result || result.length === 0) {
      throw new NotFoundException('Retailer not found');
    }

    const r = result[0];

    if (r.salesRepId !== userId) {
      throw new ForbiddenException('Not authorized to view this retailer');
    }

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
      region: { name: r.regionName },
      area: { name: r.areaName },
      distributor: { name: r.distributorName },
      territory: r.territoryName ? { name: r.territoryName } : null,
    };
  }

  async update(userId: number, id: string, updateDto: UpdateRetailerDto) {
    const retailerId = parseInt(id);
    
    // Check authorization first - simple query
    const retailer: any = await this.prisma.retailer.findUnique({
      where: { id: retailerId },
      select: { id: true, salesRepId: true },
    });

    if (!retailer) {
      throw new NotFoundException('Retailer not found');
    }

    if (retailer.salesRepId !== userId) {
      throw new ForbiddenException('Not authorized to update this retailer');
    }

    // Simple update - use Prisma ORM
    await this.prisma.retailer.update({
      where: { id: retailerId },
      data: updateDto,
    });

    await this.redis.delPattern(`retailers:sr:${userId}:*`);
    
    return this.findOne(userId, id);
  }
}

