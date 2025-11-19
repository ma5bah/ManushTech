import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto, CreateAreaDto, CreateDistributorDto, CreateTerritoryDto } from './dto/taxonomy.dto';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerAdminDto } from './dto/update-retailer-admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createRegion(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: dto });
  }

  async updateRegion(id: number, dto: CreateRegionDto) {
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async deleteRegion(id: number) {
    return this.prisma.region.delete({ where: { id } });
  }

  async getRegions() {
    return this.prisma.region.findMany({ include: { areas: true } });
  }

  async createArea(dto: CreateAreaDto) {
    return this.prisma.area.create({ data: dto });
  }

  async updateArea(id: number, dto: CreateAreaDto) {
    return this.prisma.area.update({ where: { id }, data: dto });
  }

  async deleteArea(id: number) {
    return this.prisma.area.delete({ where: { id } });
  }

  async getAreas() {
    return this.prisma.area.findMany({ include: { region: true, territories: true } });
  }

  async createDistributor(dto: CreateDistributorDto) {
    return this.prisma.distributor.create({ data: dto });
  }

  async updateDistributor(id: number, dto: CreateDistributorDto) {
    return this.prisma.distributor.update({ where: { id }, data: dto });
  }

  async deleteDistributor(id: number) {
    return this.prisma.distributor.delete({ where: { id } });
  }

  async getDistributors() {
    return this.prisma.distributor.findMany();
  }

  async createTerritory(dto: CreateTerritoryDto) {
    return this.prisma.territory.create({ data: dto });
  }

  async updateTerritory(id: number, dto: CreateTerritoryDto) {
    return this.prisma.territory.update({ where: { id }, data: dto });
  }

  async deleteTerritory(id: number) {
    return this.prisma.territory.delete({ where: { id } });
  }

  async getTerritories() {
    return this.prisma.territory.findMany({ include: { area: true } });
  }

  // Retailers CRUD
  async getRetailers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
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
      },
    });
  }

  async updateRetailer(id: number, dto: UpdateRetailerAdminDto) {
    return this.prisma.retailer.update({
      where: { id },
      data: dto,
      include: {
        region: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
      },
    });
  }

  async deleteRetailer(id: number) {
    await this.prisma.retailer.delete({ where: { id } });
  }
}

