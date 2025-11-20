import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.region.count();
  const areas = await prisma.area.count();
  const distributors = await prisma.distributor.count();
  const territories = await prisma.territory.count();
  const retailers = await prisma.retailer.count();

  console.log({
    regions,
    areas,
    distributors,
    territories,
    retailers,
  });

  if (regions > 0) {
    const allRegions = await prisma.region.findMany();
    console.log('All Regions:', allRegions.map(r => r.name));
    const allAreas = await prisma.area.findMany();
    console.log('All Areas:', allAreas.map(a => a.name));
    const allDistributors = await prisma.distributor.findMany();
    console.log('All Distributors:', allDistributors.map(d => d.name));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

