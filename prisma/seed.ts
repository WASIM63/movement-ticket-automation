import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Intentionally no guessed production master data is seeded.
  // Import the verified plant, vehicle and part CSVs supplied in docs/templates.
  console.log('Database ready. Import verified master data using the CSV templates.');
}
main().finally(() => prisma.$disconnect());
