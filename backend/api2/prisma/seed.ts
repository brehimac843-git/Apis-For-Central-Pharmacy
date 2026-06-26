import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding api2 database...");

  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.amoDrug.deleteMany();
  await prisma.drug.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.agent.deleteMany();

  await prisma.drug.createMany({
    data: [
      {
        id: 1,
        name: "Paracetamol",
        dosage: "500mg",
        form: "Tablet",
        buying_price: 100.0,
        selling_price: 150.0,
        stock_quantity: 150,
        expiry_date: new Date("2026-12-31"),
      },
      {
        id: 2,
        name: "Amoxicillin",
        dosage: "250mg",
        form: "Capsule",
        buying_price: null,
        selling_price: 300.0,
        stock_quantity: 120,
        expiry_date: new Date("2026-10-15"),
      },
      {
        id: 3,
        name: "Ibuprofen",
        dosage: "400mg",
        form: "Tablet",
        buying_price: null,
        selling_price: 250.0,
        stock_quantity: 90,
        expiry_date: new Date("2026-11-10"),
      },
      {
        id: 4,
        name: "Metformin",
        dosage: "500mg",
        form: "Tablet",
        buying_price: null,
        selling_price: 400.0,
        stock_quantity: 60,
        expiry_date: new Date("2027-01-05"),
      },
      {
        id: 5,
        name: "Artemether-Lumefantrine",
        dosage: "20/120mg",
        form: "Tablet",
        buying_price: null,
        selling_price: 1200.0,
        stock_quantity: 50,
        expiry_date: new Date("2026-08-15"),
      },
    ],
  });

  await prisma.amoDrug.createMany({
    data: [
      { id: 1, drug_id: 1, reimbursement_rate: 80 },
      { id: 2, drug_id: 2, reimbursement_rate: 70 },
      { id: 3, drug_id: 4, reimbursement_rate: 90 },
    ],
  });

  await prisma.agent.createMany({
    data: [
      {
        agent_name: "Moussa Coulibaly",
        agent_number: "AGENT2-DB2",
      },
    ],
  });

  console.log("✅ api2 seed complete: drugs, AMO data, and a sample local agent are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });