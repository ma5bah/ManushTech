import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

// Note: Prisma is ONLY used for cleanup in afterAll. All setup and assertions use HTTP API calls.

describe('E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let srToken: string;
  let srUser: any;
  let salesRep: any;
  let region: any;
  let area: any;
  let distributor: any;
  let territory: any;
  let retailer: any;
  let unassignedRetailer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // ============================================
    // CLEANUP ONLY - Prisma allowed here
    // ============================================
    await prisma.retailer.deleteMany();
    await prisma.salesRep.deleteMany();
    await prisma.territory.deleteMany();
    await prisma.area.deleteMany();
    await prisma.region.deleteMany();
    await prisma.distributor.deleteMany();
    await prisma.user.deleteMany();

    // ============================================
    // SETUP - ALL via API calls
    // ============================================
    
    // EXCEPTION: Create bootstrap admin user to start the test
    // This is the ONLY Prisma usage outside of cleanup - creating the first admin
    // to bootstrap the API-based test setup
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        email: 'bootstrap@test.com',
        username: 'bootstrap',
        password: hashedPassword,
        role: 'Admin',
      },
    });

    // Step 1: Login as bootstrap admin
    const bootstrapLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bootstrap@test.com', password: 'password123' })
      .expect(201);
    const bootstrapToken = bootstrapLoginRes.body.access_token;

    // Use bootstrap admin as the main admin for all tests
    adminToken = bootstrapToken;

    // Step 3: Create SR user via API
    const srUserRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'sr@test.com',
        username: 'salesrep1',
        password: 'password123',
        role: 'SalesRep',
      })
      .expect(201);
    
    srUser = srUserRes.body.user;
    
    if (!srUser || !srUser.id) {
      throw new Error('Failed to create SR user via API');
    }

    // Step 4: Get SalesRep record (automatically created when user is created with SalesRep role)
    // Fetch it via API
    const salesRepsRes = await request(app.getHttpServer())
      .get('/admin/sales-reps')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    salesRep = salesRepsRes.body.data.find((sr: any) => sr.username === 'salesrep1')?.salesRep;
    
    if (!salesRep || !salesRep.id) {
      throw new Error('SalesRep record was not automatically created');
    }

    // Step 5: Login as SR
    const srLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'sr@test.com', password: 'password123' })
      .expect(201);
    srToken = srLoginRes.body.access_token;

    const regionRes = await request(app.getHttpServer())
      .post('/admin/regions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Region' })
      .expect(201);
    region = regionRes.body;

    const areaRes = await request(app.getHttpServer())
      .post('/admin/areas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Area', regionId: region.id })
      .expect(201);
    area = areaRes.body;

    const distributorRes = await request(app.getHttpServer())
      .post('/admin/distributors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Distributor' })
      .expect(201);
    distributor = distributorRes.body;

    const territoryRes = await request(app.getHttpServer())
      .post('/admin/territories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Territory', areaId: area.id })
      .expect(201);
    territory = territoryRes.body;

    const retailerRes = await request(app.getHttpServer())
      .post('/admin/retailers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Retailer 1',
        phone: '1234567890',
        regionId: region.id,
        areaId: area.id,
        distributorId: distributor.id,
        territoryId: territory.id,
        points: 100,
        routes: 'Route A',
        notes: 'Test notes',
      })
      .expect(201);
    retailer = retailerRes.body;

    const unassignedRes = await request(app.getHttpServer())
      .post('/admin/retailers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unassigned Retailer',
        phone: '9876543210',
        regionId: region.id,
        areaId: area.id,
        distributorId: distributor.id,
        territoryId: territory.id,
        points: 0,
        routes: '',
        notes: '',
      })
      .expect(201);
    unassignedRetailer = unassignedRes.body;

    await request(app.getHttpServer())
      .post('/admin/assignments/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        salesRepId: salesRep.id,
        retailerIds: [retailer.id],
        action: 'assign',
      })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.retailer.deleteMany();
    await prisma.salesRep.deleteMany();
    await prisma.territory.deleteMany();
    await prisma.area.deleteMany();
    await prisma.region.deleteMany();
    await prisma.distributor.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Authentication', () => {
    describe('SR Login', () => {
      it('should allow SR to login', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'sr@test.com', password: 'password123' })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toMatchObject({
          email: 'sr@test.com',
          role: 'SalesRep',
        });
      });

      it('should reject invalid SR credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'sr@test.com', password: 'wrongpassword' })
          .expect(401);
      });
    });

    describe('Admin Login', () => {
      it('should allow Admin to login', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'bootstrap@test.com', password: 'password123' })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toMatchObject({
          email: 'bootstrap@test.com',
          role: 'Admin',
        });
      });

      it('should reject invalid Admin credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'bootstrap@test.com', password: 'wrongpassword' })
          .expect(401);
      });
    });
  });

  describe('Sales Representative (SR) Operations', () => {
    describe('SR Read Operations', () => {
      it('should get list of assigned retailers', async () => {
        const response = await request(app.getHttpServer())
          .get('/retailers')
          .set('Authorization', `Bearer ${srToken}`)
          .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.meta).toHaveProperty('total');
      });

      it('should get single assigned retailer by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: retailer.id,
          name: retailer.name,
        });
      });

      it('should not access unassigned retailer', async () => {
        await request(app.getHttpServer())
          .get(`/retailers/${unassignedRetailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(403);
      });

      it('should search retailers by name', async () => {
        const response = await request(app.getHttpServer())
          .get('/retailers?search=Test')
          .set('Authorization', `Bearer ${srToken}`)
          .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('SR Update Operations', () => {
      it('should update allowed fields (points, routes, notes)', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .send({
            points: 200,
            routes: 'Route B',
            notes: 'Updated notes',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          points: 200,
          routes: 'Route B',
          notes: 'Updated notes',
        });
      });

      it('should not update disallowed fields', async () => {
        await request(app.getHttpServer())
          .patch(`/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .send({
            name: 'Hacked Name',
            phone: '0000000000',
            regionId: 999,
          });

        // Verify through API that fields were not changed
        const response = await request(app.getHttpServer())
          .get(`/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(200);

        expect(response.body.name).toBe(retailer.name);
        expect(response.body.phone).toBe(retailer.phone);
        expect(response.body.regionId).toBe(retailer.regionId);
      });

      it('should not update unassigned retailer', async () => {
        await request(app.getHttpServer())
          .patch(`/retailers/${unassignedRetailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .send({ points: 500 })
          .expect(403);
      });
    });

    describe('SR Create/Delete Operations', () => {
      it('should not create retailers', async () => {
        await request(app.getHttpServer())
          .post('/admin/retailers')
          .set('Authorization', `Bearer ${srToken}`)
          .send({
            name: 'New Retailer',
            phone: '1111111111',
            regionId: region.id,
            areaId: area.id,
            distributorId: distributor.id,
          })
          .expect(403);
      });

      it('should not delete retailers', async () => {
        await request(app.getHttpServer())
          .delete(`/admin/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(403);
      });

      it('should not create users', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${srToken}`)
          .send({
            email: 'newuser@test.com',
            username: 'newuser',
            password: 'password123',
            role: 'SalesRep',
          })
          .expect(403);
      });
    });
  });

  describe('Admin Operations', () => {
    describe('Admin Read Operations', () => {
      it('should get all retailers', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/retailers')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      });

      it('should get single retailer by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/admin/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: retailer.id,
          name: retailer.name,
        });
      });

      it('should get all users', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
      });

      it('should get sales reps', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/sales-reps')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('Admin Create Operations', () => {
      it('should create new retailer', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/retailers')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Admin Created Retailer',
            phone: '5555555555',
            regionId: region.id,
            areaId: area.id,
            distributorId: distributor.id,
            territoryId: territory.id,
            points: 50,
            routes: 'Route C',
            notes: 'Admin notes',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          name: 'Admin Created Retailer',
          phone: '5555555555',
        });
      });

      it('should create new user (Sales Rep)', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'newsr@test.com',
            username: 'newsalesrep',
            password: 'password123',
            role: 'SalesRep',
          })
          .expect(201);

        expect(response.body.user).toMatchObject({
          email: 'newsr@test.com',
          username: 'newsalesrep',
          role: 'SalesRep',
        });
      });

      it('should create taxonomy (region, area, distributor, territory)', async () => {
        const regionRes = await request(app.getHttpServer())
          .post('/admin/regions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Region' })
          .expect(201);

        const areaRes = await request(app.getHttpServer())
          .post('/admin/areas')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Area', regionId: regionRes.body.id })
          .expect(201);

        const distRes = await request(app.getHttpServer())
          .post('/admin/distributors')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Distributor' })
          .expect(201);

        const terrRes = await request(app.getHttpServer())
          .post('/admin/territories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Territory', areaId: areaRes.body.id })
          .expect(201);

        expect(regionRes.body.name).toBe('New Region');
        expect(areaRes.body.name).toBe('New Area');
        expect(distRes.body.name).toBe('New Distributor');
        expect(terrRes.body.name).toBe('New Territory');
      });
    });

    describe('Admin Update Operations', () => {
      it('should update retailer', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/admin/retailers/${retailer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Retailer Name',
            points: 300,
          })
          .expect(200);

        expect(response.body.name).toBe('Updated Retailer Name');
        expect(response.body.points).toBe(300);
      });

      it('should update user', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/users/${srUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: srUser.email,
            username: 'updated_sr',
            password: 'password123',
            role: 'SalesRep',
          })
          .expect(200);

        expect(response.body.username).toBe('updated_sr');
      });
    });

    describe('Admin Delete Operations', () => {
      it('should delete retailer', async () => {
        // Create retailer through API
        const createResponse = await request(app.getHttpServer())
          .post('/admin/retailers')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'To Delete',
            phone: '7777777777',
            regionId: region.id,
            areaId: area.id,
            distributorId: distributor.id,
          })
          .expect(201);

        const toDeleteId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/admin/retailers/${toDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify through API that it's deleted
        await request(app.getHttpServer())
          .get(`/admin/retailers/${toDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should delete user', async () => {
        // Create user through API
        const createResponse = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'todelete@test.com',
            username: 'todelete',
            password: 'password123',
            role: 'SalesRep',
          })
          .expect(201);

        const toDeleteId = createResponse.body.user.id;

        await request(app.getHttpServer())
          .delete(`/users/${toDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);

        // Verify through API that it's deleted
        await request(app.getHttpServer())
          .get(`/users/${toDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('Admin Bulk Assignment', () => {
      it('should assign retailers to SR', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/assignments/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            salesRepId: salesRep.id,
            retailerIds: [unassignedRetailer.id],
            action: 'assign',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.affected).toBe(1);

        // Verify through API - SR should now be able to access this retailer
        const srResponse = await request(app.getHttpServer())
          .get(`/retailers/${unassignedRetailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(200);

        expect(srResponse.body.id).toBe(unassignedRetailer.id);
      });

      it('should unassign retailers from SR', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/assignments/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            salesRepId: salesRep.id,
            retailerIds: [unassignedRetailer.id],
            action: 'unassign',
          })
          .expect(201);

        expect(response.body.success).toBe(true);

        // Verify through API - SR should no longer be able to access this retailer
        await request(app.getHttpServer())
          .get(`/retailers/${unassignedRetailer.id}`)
          .set('Authorization', `Bearer ${srToken}`)
          .expect(403);
      });

      it('should not assign already assigned retailers', async () => {
        await request(app.getHttpServer())
          .post('/admin/assignments/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            salesRepId: salesRep.id,
            retailerIds: [retailer.id],
            action: 'assign',
          })
          .expect(400);
      });
    });

    describe('Admin Bulk Import', () => {
      it('should import retailers from CSV', async () => {
        const csvContent = `name,region,area,distributor,territory,phone,points,routes,notes
CSV Retailer 1,Test Region,Test Area,Test Distributor,Test Territory,8888888888,100,Route X,CSV notes
CSV Retailer 2,Test Region,Test Area,Test Distributor,Test Territory,9999999999,200,Route Y,More notes`;

        const response = await request(app.getHttpServer())
          .post('/admin/retailers/import')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', Buffer.from(csvContent), 'retailers.csv')
          .expect(201);

        expect(response.body.imported).toBeGreaterThan(0);
      });

      it('should reject non-CSV files', async () => {
        await request(app.getHttpServer())
          .post('/admin/retailers/import')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', Buffer.from('not csv'), {
            filename: 'file.txt',
            contentType: 'text/plain',
          })
          .expect(400);
      });

      it('should reject CSV without required columns', async () => {
        const csvContent = `name,phone
Incomplete,1234567890`;

        await request(app.getHttpServer())
          .post('/admin/retailers/import')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', Buffer.from(csvContent), 'retailers.csv')
          .expect(400);
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/retailers').expect(401);

      await request(app.getHttpServer()).get('/admin/retailers').expect(401);
    });

    it('should reject SR accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/admin/retailers')
        .set('Authorization', `Bearer ${srToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/admin/retailers')
        .set('Authorization', `Bearer ${srToken}`)
        .send({})
        .expect(403);
    });

    it('should reject admin accessing SR-only endpoints', async () => {
      await request(app.getHttpServer())
        .get('/retailers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
