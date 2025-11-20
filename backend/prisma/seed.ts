import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.salesRepRetailer.deleteMany({});
  await prisma.retailer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.territory.deleteMany({});
  await prisma.distributor.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.region.deleteMany({});
  console.log('Existing data cleared.');

  // Create regions
  console.log('Creating regions...');
  const regionsData = [
    { name: 'Dhaka' },
    { name: 'Chittagong' },
    { name: 'Khulna' },
    { name: 'Rajshahi' },
    { name: 'Sylhet' },
  ];
  await prisma.region.createMany({ data: regionsData });
  const regions = await prisma.region.findMany();

  // Create areas
  console.log('Creating areas...');
  const areasData = [
    { name: 'Gulshan', regionId: regions[0].id },
    { name: 'Motijheel', regionId: regions[0].id },
    { name: 'Agrabad', regionId: regions[1].id },
    { name: 'Khulna Sadar', regionId: regions[2].id },
    { name: 'Boalia', regionId: regions[3].id },
    { name: 'Sylhet Sadar', regionId: regions[4].id },
  ];
  await prisma.area.createMany({ data: areasData });
  const areas = await prisma.area.findMany();

  // Create distributors
  console.log('Creating distributors...');
  const distributorsData = [
    { name: 'Unilever Bangladesh' },
    { name: 'ACI Limited' },
    { name: 'Square Group' },
    { name: 'Pran-RFL Group' },
  ];
  await prisma.distributor.createMany({ data: distributorsData });
  const distributors = await prisma.distributor.findMany();

  // Create territories
  console.log('Creating territories...');
  const territoriesData = [
    { name: 'Banani', areaId: areas[0].id },
    { name: 'Dilkusha', areaId: areas[1].id },
    { name: 'Halishahar', areaId: areas[2].id },
  ];
  await prisma.territory.createMany({ data: territoriesData });
  const territories = await prisma.territory.findMany();

  // Create admin user
  console.log('Creating admin user...');
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      phone: '01700000000',
      password: adminHash,
      role: Role.Admin,
    },
  });

  // Create sales reps
  console.log('Creating sales reps...');
  const srHash = await bcrypt.hash('sr123', 10);
  const salesReps = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `sr${i}@example.com`,
        username: `sr00${i}`,
        phone: `0171111111${i}`,
        password: srHash,
        role: Role.SalesRep,
        salesRep: {
          create: {
            name: `Sales Rep ${i}`,
          },
        },
      },
      include: {
        salesRep: true,
      },
    });
    salesReps.push(user.salesRep);
  }

  // Create retailers
  console.log('Creating retailers...');
  const retailerData = [];
  for (let i = 0; i < 200; i++) {
    const region = regions[i % regions.length];
    const area = areas.filter(a => a.regionId === region.id)[i % areas.filter(a => a.regionId === region.id).length] || areas[0];
    const territory = territories.filter(t => t.areaId === area.id)[i % territories.filter(t => t.areaId === area.id).length];
    const distributor = distributors[i % distributors.length];

    retailerData.push({
      name: `Retail Store ${i + 1}`,
      phone: `017${String(10000000 + i).padStart(8, '0')}`,
      regionId: region.id,
      areaId: area.id,
      distributorId: distributor.id,
      territoryId: territory ? territory.id : null,
      points: Math.floor(Math.random() * 5000),
      routes: `Route ${Math.floor(Math.random() * 20) + 1}`,
      notes: `Notes for retailer ${i+1}`,
    });
  }
  await prisma.retailer.createMany({ data: retailerData });

  const allRetailers = await prisma.retailer.findMany();

  // Assign retailers to SRs
  console.log('Assigning retailers to sales reps...');
  let retailerIndex = 0;
  for (const salesRep of salesReps) {
    if (!salesRep) continue;
    const retailersToAssign = allRetailers.slice(retailerIndex, retailerIndex + 40);
    if (retailersToAssign.length > 0) {
      await prisma.salesRepRetailer.createMany({
        data: retailersToAssign.map(r => ({
          salesRepId: salesRep.id,
          retailerId: r.id,
        })),
        skipDuplicates: true,
      });
      retailerIndex += 40;
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
