import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto, CreateAreaDto, CreateDistributorDto, CreateTerritoryDto } from './dto/taxonomy.dto';

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
}

