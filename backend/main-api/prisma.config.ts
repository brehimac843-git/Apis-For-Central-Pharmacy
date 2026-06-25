import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // 🚀 FIXED FOR PRISMA 7: Tell Prisma how to execute your seed file
    seed: "ts-node prisma/seed.ts", 
  },
  datasource: {
    url: env("DATABASE_URL"), 
  },
});