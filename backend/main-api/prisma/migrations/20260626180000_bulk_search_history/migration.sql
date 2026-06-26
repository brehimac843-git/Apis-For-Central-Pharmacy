-- AlterTable
ALTER TABLE "search_histories" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'single';
ALTER TABLE "search_histories" ADD COLUMN "payload" JSONB;
