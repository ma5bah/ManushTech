import { Test, TestingModule } from '@nestjs/testing';
import { RetailersService } from './retailers.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';

const mockPrismaService = {
  salesRep: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  delPattern: jest.fn(),
};

describe('RetailersService', () => {
  let service: RetailersService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetailersService,
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

    service = module.get<RetailersService>(RetailersService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllAssigned', () => {
    const userId = 1;
    const salesRepId = 100;
    const query = { page: 1, limit: 10 };
    const mockRetailers = [
      {
        id: 1,
        name: 'Retailer A',
        regionName: 'Dhaka',
        areaName: 'Gulshan',
        distributorName: 'Dist A',
        territoryName: 'T1',
      },
    ];

    it('should return cached data if available', async () => {
      const cachedData = {
        data: [{ id: 1, name: 'Cached Retailer' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (prismaService.salesRep.findUnique as jest.Mock).mockResolvedValue({ id: salesRepId });
      (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.findAllAssigned(userId, query);

      expect(result).toEqual(cachedData);
      expect(prismaService.salesRep.findUnique).toHaveBeenCalledWith({ where: { userId } });
      expect(redisService.get).toHaveBeenCalled();
      // Should NOT call database query
      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache result on cache miss', async () => {
      (prismaService.salesRep.findUnique as jest.Mock).mockResolvedValue({ id: salesRepId });
      (redisService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock the two raw queries: first for data, second for count
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockRetailers) // Data query
        .mockResolvedValueOnce([{ count: 1 }]); // Count query

      const result = await service.findAllAssigned(userId, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Retailer A');
      expect(result.meta.total).toBe(1);

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining(`retailers:sr:${salesRepId}`),
        expect.any(String),
        300
      );
    });

    it('should return empty list if user is not a sales rep', async () => {
      (prismaService.salesRep.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findAllAssigned(userId, query);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(redisService.get).not.toHaveBeenCalled();
    });
  });
});

