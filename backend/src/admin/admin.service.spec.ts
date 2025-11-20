import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  region: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  area: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  distributor: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  territory: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  retailer: {
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockRedisService = {
  delPattern: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bulkAssign', () => {
    const dto = {
      salesRepId: 100,
      retailerIds: [1, 2, 3],
      action: 'assign' as const,
    };

    it('should successfully assign retailers when no conflicts exist', async () => {
      // Mock conflict check to return empty array (no existing assignments)
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([]);
      
      // Mock update execution
      (prismaService.$executeRaw as jest.Mock).mockResolvedValue(3);

      const result = await service.bulkAssign(dto);

      expect(result.success).toBe(true);
      expect(result.affected).toBe(3);
      
      // Verify cache invalidation
      expect(redisService.delPattern).toHaveBeenCalledWith(`retailers:sr:${dto.salesRepId}:*`);
      
      // Verify DB calls
      expect(prismaService.$queryRaw).toHaveBeenCalled();
      expect(prismaService.$executeRaw).toHaveBeenCalled();
    });

    it('should throw BadRequestException when conflicts exist', async () => {
      // Mock conflict check to return conflicting retailer
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Retailer A', salesRep_id: 999, salesRep_name: 'Other SR' }
      ]);

      await expect(service.bulkAssign(dto)).rejects.toThrow(BadRequestException);
      
      // Should NOT execute update
      expect(prismaService.$executeRaw).not.toHaveBeenCalled();
    });

    it('should unassign retailers without conflict check', async () => {
      const unassignDto = { ...dto, action: 'unassign' as const };
      
      (prismaService.$executeRaw as jest.Mock).mockResolvedValue(3);

      const result = await service.bulkAssign(unassignDto);

      expect(result.success).toBe(true);
      
      // Should NOT perform conflict check query
      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
      // Should perform update
      expect(prismaService.$executeRaw).toHaveBeenCalled();
    });
  });
});

