import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

// Initialize the PostgreSQL driver adapter for Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

  await prisma.searchHistory.deleteMany();
  await prisma.publicUser.deleteMany();
  await prisma.centralAdmin.deleteMany();
  await prisma.drugVisibility.deleteMany();
  await prisma.agentActivityLog.deleteMany();
  await prisma.agentRecord.deleteMany();
  await prisma.pharmacy.deleteMany();

  await prisma.pharmacy.createMany({
    data: [
      {
        id: 1,
        name: "Pharmacie DB1",
        address: "Rue 125 Porte 45",
        city: "Bamako",
        phone: "+22370000001",
        email: "db1@pharma.ml",
        latitude: 12.62,
        longitude: -7.99,
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
        latitude: 12.6392,
        longitude: -8.0029,
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
        latitude: 12.63,
        longitude: -8.015,
        amo_supported: true,
        api_url: "http://localhost:3003",
      },
    ],
  });

  await pool.query("SELECT setval('public.pharmacies_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.pharmacies), true);");

  await prisma.centralAdmin.create({
    data: {
      email: "admin@pharma.ml",
      password: "admin123",
    },
  });

  const bcryptHash = await bcrypt.hash("userpass123", 10);

  const user1 = await prisma.publicUser.create({
    data: {
      name: "Seydou Diarra",
      email: "user1@pharma.ml",
      password: bcryptHash,
    },
  });

  const user2 = await prisma.publicUser.create({
    data: {
      name: "Aminata Coulibaly",
      email: "user2@pharma.ml",
      password: bcryptHash,
    },
  });

  await prisma.searchHistory.createMany({
    data: [
      {
        publicUserId: user1.id,
        query: "paracetamol",
        type: "single",
      },
      {
        publicUserId: user2.id,
        query: "amoxicillin",
        type: "single",
      },
    ],
  });

  console.log("✅ Seed complete: pharmacies, central admin, public users, and search history created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });