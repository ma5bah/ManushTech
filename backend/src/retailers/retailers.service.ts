import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RetailerQueryDto } from './dto/retailer-query.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class RetailersService {
  constructor(private prisma: PrismaService) {}

  async findAllAssigned(userId: number, query: RetailerQueryDto) {
    const { page = 1, limit = 20, search, regionId, areaId, distributorId, territoryId } = query;
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { salesRep: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const where: any = {};

    // Both SalesRep and Admin can see all retailers (no assignment filter)

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
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

  async findOne(userId: number, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { salesRep: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

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

    // Both SalesRep and Admin can view any retailer (no assignment check)

    return retailer;
  }

  async update(userId: number, id: string, updateDto: UpdateRetailerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { salesRep: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const retailer = await this.prisma.retailer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!retailer) {
      throw new NotFoundException('Retailer not found');
    }

    // Both SalesRep and Admin can update retailers
    // SalesRep can only update Points, Routes, Notes (enforced by DTO)
    // Admin can update any fields (handled in admin controller)

    return this.prisma.retailer.update({
      where: { id: parseInt(id) },
      data: updateDto,
    });
  }
}

