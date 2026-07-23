import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js"; // Points to your custom generated folder
import dotenv from "dotenv";

dotenv.config();

// 1. Keep your existing environment variable pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 2. Wrap it with the Prisma 7 Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Export the instantiated client instead of the raw pool
export const prisma = new PrismaClient({ adapter });