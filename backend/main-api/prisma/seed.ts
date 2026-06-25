import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Initialize the PostgreSQL driver adapter for Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear dependent data in the correct order before deleting pharmacies
  await prisma.drugVisibility.deleteMany({});
  await prisma.agentActivityLog.deleteMany({});
  await prisma.agentRecord.deleteMany({});
  await prisma.pharmacy.deleteMany({});

  // Re-inject your 3 Bamako pharmacies
  await prisma.pharmacy.createMany({
    data: [
      {
        id: 1,
        name: "Pharmacie DB1",
        address: "Rue 125 Porte 45",
        city: "Bamako",
        phone: "+22370000001",
        email: "db1@pharma.ml",
        latitude: 12.62000000,
        longitude: -7.99000000,
        amo_supported: true,
        api_url: "http://localhost:3001",
      },
      {
        id: 2,
        name: "Pharmacie DB2",
        address: "Avenue Modibo Keita",
        city: "Bamako",
        phone: "+22370000002",
        email: "db2@pharma.ml",
        latitude: 12.63920000,
        longitude: -8.00290000,
        amo_supported: true,
        api_url: "http://localhost:3002",
      },
      {
        id: 3,
        name: "Pharmacie DB3",
        address: "Quartier Badalabougou",
        city: "Bamako",
        phone: "+22370000003",
        email: "db3@pharma.ml",
        latitude: 12.63000000,
        longitude: -8.81500000,
        amo_supported: true,
        api_url: "http://localhost:3003",
      },
    ],
  });

  console.log("✅ Seeding complete! All pharmacies restored successfully.");

  await prisma.centralAdmin.upsert({
    where: { email: "admin@pharma.ml" },
    update: { password: "admin123" },
    create: {
      email: "admin@pharma.ml",
      password: "admin123",
    },
  });

  console.log("✅ Default admin credentials seeded: admin@pharma.ml / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Safely disconnect client and close the connection pool
    await prisma.$disconnect();
    await pool.end();
  });