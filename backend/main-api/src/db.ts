import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import dotenv from "dotenv"; // <-- ADD THIS

dotenv.config(); // <-- ADD THIS to load the .env file immediately!

// 1. Create your standard pg pool using your environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Wrap it with the Prisma 7 Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Export the instantiated client
export const prisma = new PrismaClient({ adapter });
