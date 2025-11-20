import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RetailerQueryDto } from './dto/retailer-query.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

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

    const where: any = {
      assignments: {
        some: { salesRepId: userId },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { uid: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (regionId) where.regionId = parseInt(regionId);
    if (areaId) where.areaId = parseInt(areaId);
    if (distributorId) where.distributorId = parseInt(distributorId);
    if (territoryId) where.territoryId = parseInt(territoryId);

    const [retailers, total] = await Promise.all([
      this.prisma.retailer.findMany({
        where,
        skip,
        take: limit,
        include: {
          region: { select: { name: true } },
          area: { select: { name: true } },
          distributor: { select: { name: true } },
          territory: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.retailer.count({ where }),
    ]);

    const result = {
      data: retailers,
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
    const retailer = await this.prisma.retailer.findUnique({
      where: { id: parseInt(id) },
      include: {
        region: { select: { name: true } },
        area: { select: { name: true } },
        distributor: { select: { name: true } },
        territory: { select: { name: true } },
        assignments: { select: { salesRepId: true } },
      },
    });

    if (!retailer) {
      throw new NotFoundException('Retailer not found');
    }

    const isAssigned = retailer.assignments.some((a) => a.salesRepId === userId);
    if (!isAssigned) {
      throw new ForbiddenException('Not authorized to view this retailer');
    }

    return retailer;
  }

  async update(userId: number, id: string, updateDto: UpdateRetailerDto) {
    const retailer = await this.prisma.retailer.findUnique({
      where: { id: parseInt(id) },
      include: { assignments: { select: { salesRepId: true } } },
    });

    if (!retailer) {
      throw new NotFoundException('Retailer not found');
    }

    const isAssigned = retailer.assignments.some((a) => a.salesRepId === userId);
    if (!isAssigned) {
      throw new ForbiddenException('Not authorized to update this retailer');
    }

    const updated = await this.prisma.retailer.update({
      where: { id: parseInt(id) },
      data: updateDto,
    });

    await this.redis.delPattern(`retailers:sr:${userId}:*`);
    return updated;
  }
}

